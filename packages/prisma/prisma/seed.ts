import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const triggers = [
    { name: "manual" },
    { name: "webhook" },
    { name: "schedule" },
  ];

  // Canonical action names — must match what the frontend routes against
  const actions = [
    { name: "webhook" },
    { name: "notion" },
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
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });