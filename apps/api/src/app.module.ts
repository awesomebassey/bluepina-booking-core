import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { BookingModule } from "./booking/booking.module";
import { CalendarModule } from "./calendar/calendar.module";
import { HostModule } from "./host/host.module";
import { HealthController } from "./health/health.controller";

@Module({ imports: [PrismaModule, BookingModule, CalendarModule, HostModule], controllers: [HealthController] })
export class AppModule {}
