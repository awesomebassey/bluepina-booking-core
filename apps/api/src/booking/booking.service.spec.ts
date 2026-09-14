import { BookingService } from "./booking.service";
import { PrismaService } from "../prisma/prisma.service";

/**
 * This is intentionally a database integration test rather than a mocked unit test.
 * The behavior being proven lives in PostgreSQL's unique constraint and transaction semantics.
 */
describe("BookingService concurrency", () => {
  const prisma = new PrismaService();
  const service = new BookingService(prisma);
  let propertyId: string;
  let unitId: string;

  beforeAll(async () => {
    await prisma.$connect();
    const suffix = Date.now().toString(36);
    const property = await prisma.property.create({
      data: {
        name: "Concurrency Test",
        slug: `concurrency-${suffix}`,
        status: "ACTIVE",
        units: { create: { name: "Only Room", capacity: 2, nightlyRateCents: 10000, currency: "USD" } }
      },
      include: { units: true }
    });
    propertyId = property.id;
    unitId = property.units[0].id;
  });

  afterAll(async () => {
    if (propertyId) await prisma.property.delete({ where: { id: propertyId } });
    await prisma.$disconnect();
  });

  it("allows only one of two concurrent overlapping holds to win", async () => {
    const [a, b] = await Promise.allSettled([
      service.createHold({ unitId, checkIn: "2026-11-10", checkOut: "2026-11-13", idempotencyKey: `a-${Date.now()}` }),
      service.createHold({ unitId, checkIn: "2026-11-11", checkOut: "2026-11-12", idempotencyKey: `b-${Date.now()}` })
    ]);

    const fulfilled = [a, b].filter((result) => result.status === "fulfilled");
    const rejected = [a, b].filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });

  it("returns the original hold when the same idempotency key is retried", async () => {
    const key = `retry-${Date.now()}`;
    const first = await service.createHold({ unitId, checkIn: "2026-12-01", checkOut: "2026-12-03", idempotencyKey: key });
    const second = await service.createHold({ unitId, checkIn: "2026-12-01", checkOut: "2026-12-03", idempotencyKey: key });
    expect(second.id).toBe(first.id);
  });
});
