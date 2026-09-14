import { PrismaClient, PropertyStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.upsert({
    where: { slug: "casa-serena" },
    update: {},
    create: {
      name: "Casa Serena Retreat",
      slug: "casa-serena",
      timezone: "America/Mexico_City",
      status: PropertyStatus.ACTIVE,
      units: {
        create: {
          name: "Garden Suite",
          capacity: 2,
          nightlyRateCents: 18500,
          currency: "USD"
        }
      }
    },
    include: { units: true }
  });

  console.log(JSON.stringify({ property, unit: property.units[0] }, null, 2));
}

main().finally(() => prisma.$disconnect());
