import { IsDateString, IsEmail, IsIn, IsNotEmpty, IsString } from "class-validator";

export class CreateHoldDto {
  @IsString() @IsNotEmpty() unitId!: string;
  @IsDateString() checkIn!: string;
  @IsDateString() checkOut!: string;
  @IsString() @IsNotEmpty() idempotencyKey!: string;
}

export class CreateBookingDto {
  @IsString() @IsNotEmpty() holdId!: string;
  @IsString() @IsNotEmpty() guestName!: string;
  @IsEmail() guestEmail!: string;
}

export class PaymentWebhookDto {
  @IsString() @IsNotEmpty() eventId!: string;
  @IsString() @IsNotEmpty() bookingId!: string;
  @IsString() @IsNotEmpty() providerRef!: string;
  @IsIn(["SUCCEEDED", "FAILED", "REFUNDED"]) status!: "SUCCEEDED" | "FAILED" | "REFUNDED";
}
