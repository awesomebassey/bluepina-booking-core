import { Body, Controller, Get, Post } from "@nestjs/common";
import { HostService } from "./host.service";
import { OnboardPropertyDto } from "./host.dto";
@Controller("host")
export class HostController {
  constructor(private readonly service: HostService) {}
  @Post("onboard") onboard(@Body() dto: OnboardPropertyDto) {
    return this.service.onboard(dto);
  }
  @Get("properties") properties() {
    return this.service.properties();
  }
}
