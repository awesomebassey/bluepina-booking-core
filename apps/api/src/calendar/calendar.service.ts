import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SyncCalendarDto } from "./calendar.dto";

const MS_DAY = 86_400_000;
function dateOnly(v: string) { return new Date(`${v}T00:00:00.000Z`); }
function expand(start: string, end: string) {
  const a = dateOnly(start), b = dateOnly(end);
  const n = Math.max(0, Math.round((b.valueOf() - a.valueOf()) / MS_DAY));
  return Array.from({ length: n }, (_, i) => new Date(a.valueOf() + i * MS_DAY));
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async sync(dto: SyncCalendarDto) {
    const conflicts: Array<{ externalRef: string; date: string }> = [];
    let created = 0;
    for (const range of dto.ranges) {
      for (const date of expand(range.start, range.end)) {
        try {
          await this.prisma.reservationBlock.create({
            data: { unitId: dto.unitId, date, source: "EXTERNAL_CALENDAR", externalRef: range.externalRef }
          });
          created += 1;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const existing = await this.prisma.reservationBlock.findUnique({ where: { unitId_date: { unitId: dto.unitId, date } } });
            if (existing?.externalRef !== range.externalRef) conflicts.push({ externalRef: range.externalRef, date: date.toISOString().slice(0, 10) });
          } else throw error;
        }
      }
    }
    return { created, conflicts };
  }
}
