import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { CreateBookingDto, CreateHoldDto, PaymentWebhookDto } from "./booking.dto";

@Controller()
export class BookingController {
  constructor(private readonly service: BookingService) {}

  @Get("availability")
  availability(@Query("unitId") unitId: string, @Query("from") from: string, @Query("to") to: string) {
    return this.service.availability(unitId, from, to);
  }

  @Post("holds")
  createHold(@Body() dto: CreateHoldDto) { return this.service.createHold(dto); }

  @Post("holds/reap-expired")
  reapExpired() { return this.service.reapExpired(); }

  @Post("bookings")
  createBooking(@Body() dto: CreateBookingDto) { return this.service.createBooking(dto); }

  @Post("payments/webhook")
  paymentWebhook(@Body() dto: PaymentWebhookDto) { return this.service.processPayment(dto); }
}
