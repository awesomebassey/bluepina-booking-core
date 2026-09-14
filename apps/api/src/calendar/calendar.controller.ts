import { Body, Controller, Post } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { SyncCalendarDto } from "./calendar.dto";
@Controller("calendar")
export class CalendarController {
  constructor(private readonly service: CalendarService) {}
  @Post("sync") sync(@Body() dto: SyncCalendarDto) { return this.service.sync(dto); }
}
