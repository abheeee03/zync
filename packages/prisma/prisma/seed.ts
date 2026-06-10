import { prisma } from "../prisma";

/**
 * Seed script — run via:
 *   pnpm --filter @repo/prisma seed
 *
 * The DATABASE_URL is expected to be set in the environment or in
 * packages/prisma/.env (Prisma CLI loads .env automatically).
 */
async function main() {
  // Canonical trigger names — must match what the frontend routes against
  const triggers = [
    { name: "Manual Trigger" },
    { name: "Webhook" },
  ];

  // Canonical action names — must match what the frontend routes against
  const actions = [
    { name: "Webhook" },
    { name: "Http Request" },
  ];

  console.log("Seeding available triggers...");
  for (const trigger of triggers) {
    await prisma.availableTriggers.upsert({
      where: { name: trigger.name },
      update: {},
      create: trigger,
    });
    console.log(`  ✓ ${trigger.name}`);
  }

  console.log("Seeding available actions...");
  for (const action of actions) {
    await prisma.availableActions.upsert({
      where: { name: action.name },
      update: {},
      create: action,
    });
    console.log(`  ✓ ${action.name}`);
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
