import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BookingStatus, HoldStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBookingDto, CreateHoldDto, PaymentWebhookDto } from "./booking.dto";

const MS_DAY = 86_400_000;

function utcDate(value: string) {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.valueOf())) throw new BadRequestException("Invalid date");
  return d;
}

function nights(checkIn: Date, checkOut: Date) {
  const n = Math.round((checkOut.valueOf() - checkIn.valueOf()) / MS_DAY);
  if (n <= 0 || n > 30) throw new BadRequestException("Stay must be 1-30 nights");
  return n;
}

function datesBetween(checkIn: Date, checkOut: Date) {
  const count = nights(checkIn, checkOut);
  return Array.from({ length: count }, (_, i) => new Date(checkIn.valueOf() + i * MS_DAY));
}

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async availability(unitId: string, fromRaw: string, toRaw: string) {
    const from = utcDate(fromRaw);
    const to = utcDate(toRaw);
    const days = datesBetween(from, to);
    const blocks = await this.prisma.reservationBlock.findMany({
      where: { unitId, date: { gte: from, lt: to } },
      select: { date: true, source: true }
    });
    const blocked = new Map(blocks.map((b) => [b.date.toISOString().slice(0, 10), b.source]));
    return days.map((date) => {
      const key = date.toISOString().slice(0, 10);
      return { date: key, available: !blocked.has(key), source: blocked.get(key) ?? null };
    });
  }

  async createHold(dto: CreateHoldDto) {
    const existing = await this.prisma.reservationHold.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) return existing;

    const checkIn = utcDate(dto.checkIn);
    const checkOut = utcDate(dto.checkOut);
    const dates = datesBetween(checkIn, checkOut);
    const expiresAt = new Date(Date.now() + 15 * 60_000);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const unit = await tx.unit.findUnique({ where: { id: dto.unitId } });
        if (!unit) throw new NotFoundException("Unit not found");

        const hold = await tx.reservationHold.create({
          data: { unitId: dto.unitId, checkIn, checkOut, expiresAt, idempotencyKey: dto.idempotencyKey }
        });

        await tx.reservationBlock.createMany({
          data: dates.map((date) => ({ unitId: dto.unitId, date, source: "HOLD", holdId: hold.id }))
        });

        await tx.auditEvent.create({
          data: { entityType: "ReservationHold", entityId: hold.id, action: "HOLD_CREATED", metadata: { nights: dates.length } }
        });
        return hold;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // If two identical retries raced, the idempotency-key winner is the correct response.
        const winner = await this.prisma.reservationHold.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
        if (winner) return winner;
        throw new ConflictException("One or more requested nights are no longer available");
      }
      throw error;
    }
  }

  async reapExpired() {
    const expired = await this.prisma.reservationHold.findMany({
      where: { status: HoldStatus.ACTIVE, expiresAt: { lte: new Date() } }, select: { id: true }
    });
    if (!expired.length) return { expired: 0 };
    const ids = expired.map((h) => h.id);
    await this.prisma.$transaction([
      this.prisma.reservationBlock.deleteMany({ where: { holdId: { in: ids } } }),
      this.prisma.reservationHold.updateMany({ where: { id: { in: ids } }, data: { status: HoldStatus.EXPIRED } })
    ]);
    return { expired: ids.length };
  }

  async createBooking(dto: CreateBookingDto) {
    const existing = await this.prisma.booking.findUnique({ where: { holdId: dto.holdId } });
    if (existing) return existing;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const hold = await tx.reservationHold.findUnique({ where: { id: dto.holdId }, include: { unit: true } });
        if (!hold) throw new NotFoundException("Hold not found");
        if (hold.status !== HoldStatus.ACTIVE) throw new ConflictException("Hold is not active");
        if (hold.expiresAt <= new Date()) throw new ConflictException("Hold has expired");
        const count = nights(hold.checkIn, hold.checkOut);
        const booking = await tx.booking.create({
          data: {
            holdId: hold.id, unitId: hold.unitId, guestName: dto.guestName, guestEmail: dto.guestEmail,
            totalAmountCents: count * hold.unit.nightlyRateCents, currency: hold.unit.currency
          }
        });
        // Once checkout begins, inventory belongs to the booking lifecycle rather than the short hold timer.
        await tx.reservationHold.update({ where: { id: hold.id }, data: { status: HoldStatus.BOOKING_CREATED } });
        await tx.auditEvent.create({
          data: { entityType: "Booking", entityId: booking.id, action: "BOOKING_CREATED", metadata: { holdId: hold.id } }
        });
        return booking;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const winner = await this.prisma.booking.findUnique({ where: { holdId: dto.holdId } });
        if (winner) return winner;
      }
      throw error;
    }
  }

  async processPayment(dto: PaymentWebhookDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.paymentEvent.findUnique({ where: { eventId: dto.eventId } });
      if (duplicate) return { duplicate: true, event: duplicate };

      const booking = await tx.booking.findUnique({
        where: { id: dto.bookingId },
        include: { hold: true }
      });
      if (!booking) throw new NotFoundException("Booking not found");

      const event = await tx.paymentEvent.create({
        data: { eventId: dto.eventId, bookingId: dto.bookingId, providerRef: dto.providerRef, status: dto.status, payload: dto as unknown as Prisma.InputJsonValue }
      });

      // A provider can legally redeliver different events for the same charge. Event idempotency
      // prevents replay; the state checks below prevent an impossible transition from being applied.
      if (dto.status === "SUCCEEDED") {
        if (booking.status === BookingStatus.CONFIRMED) {
          return { duplicate: false, event, bookingStatus: booking.status, stateChanged: false };
        }
        if (booking.hold.status !== HoldStatus.BOOKING_CREATED || booking.status !== BookingStatus.PENDING_PAYMENT) {
          await tx.auditEvent.create({
            data: { entityType: "Booking", entityId: booking.id, action: "PAYMENT_RECONCILIATION_REQUIRED", metadata: { eventId: dto.eventId, received: dto.status, bookingStatus: booking.status, holdStatus: booking.hold.status } }
          });
          return { duplicate: false, event, bookingStatus: booking.status, stateChanged: false, reconciliationRequired: true };
        }
        await tx.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.CONFIRMED } });
        await tx.reservationHold.update({ where: { id: booking.holdId }, data: { status: HoldStatus.CONVERTED } });
      }

      if (dto.status === "FAILED") {
        if (booking.status !== BookingStatus.PENDING_PAYMENT || booking.hold.status !== HoldStatus.BOOKING_CREATED) {
          await tx.auditEvent.create({
            data: { entityType: "Booking", entityId: booking.id, action: "PAYMENT_RECONCILIATION_REQUIRED", metadata: { eventId: dto.eventId, received: dto.status, bookingStatus: booking.status, holdStatus: booking.hold.status } }
          });
          return { duplicate: false, event, bookingStatus: booking.status, stateChanged: false, reconciliationRequired: true };
        }
        await tx.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.PAYMENT_FAILED } });
        await tx.reservationHold.update({ where: { id: booking.holdId }, data: { status: HoldStatus.CANCELLED } });
        await tx.reservationBlock.deleteMany({ where: { holdId: booking.holdId } });
      }

      if (dto.status === "REFUNDED") {
        if (booking.status !== BookingStatus.CONFIRMED) {
          await tx.auditEvent.create({
            data: { entityType: "Booking", entityId: booking.id, action: "PAYMENT_RECONCILIATION_REQUIRED", metadata: { eventId: dto.eventId, received: dto.status, bookingStatus: booking.status } }
          });
          return { duplicate: false, event, bookingStatus: booking.status, stateChanged: false, reconciliationRequired: true };
        }
        await tx.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.CANCELLED } });
        await tx.reservationBlock.deleteMany({ where: { holdId: booking.holdId } });
        await tx.reservationHold.update({ where: { id: booking.holdId }, data: { status: HoldStatus.CANCELLED } });
      }

      await tx.auditEvent.create({
        data: { entityType: "Booking", entityId: booking.id, action: `PAYMENT_${dto.status}`, metadata: { eventId: dto.eventId } }
      });

        const current = await tx.booking.findUniqueOrThrow({ where: { id: booking.id } });
        return { duplicate: false, event, bookingStatus: current.status, stateChanged: true };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const winner = await this.prisma.paymentEvent.findUnique({ where: { eventId: dto.eventId } });
        if (winner) return { duplicate: true, event: winner };
      }
      throw error;
    }
  }
}
