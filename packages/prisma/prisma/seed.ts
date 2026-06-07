import { prisma } from "../prisma";

async function main() {
  const triggers = [
    { name: 'Manual Trigger' },
    { name: 'Webhook' },
  ];

  const actions = [
    { name: 'HTTP Request' },
    { name: 'Webhook' },
  ];

  console.log('Seeding available triggers...');
  for (const trigger of triggers) {
    await prisma.availableTriggers.upsert({
      where: { name: trigger.name },
      update: {},
      create: trigger,
    });
  }

  console.log('Seeding available actions...');
  for (const action of actions) {
    await prisma.availableActions.upsert({
      where: { name: action.name },
      update: {},
      create: action,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
