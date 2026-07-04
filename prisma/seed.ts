import { defaultTripProfile } from "../lib/trips";
import { prisma } from "../lib/db";

async function main() {
  await prisma.tripProfile.upsert({
    where: { id: defaultTripProfile.id },
    create: defaultTripProfile,
    update: defaultTripProfile,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
