import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OnboardPropertyDto } from "./host.dto";
@Injectable()
export class HostService {
  constructor(private readonly prisma: PrismaService) {}
  async onboard(dto: OnboardPropertyDto) {
    return this.prisma.property.create({
      data: {
        name: dto.propertyName, slug: dto.slug, timezone: dto.timezone, status: "ACTIVE",
        units: { create: { name: dto.unitName, capacity: dto.capacity, nightlyRateCents: dto.nightlyRateCents, currency: dto.currency.toUpperCase() } }
      },
      include: { units: true }
    });
  }
  properties() { return this.prisma.property.findMany({ include: { units: true }, orderBy: { createdAt: "desc" } }); }
}
