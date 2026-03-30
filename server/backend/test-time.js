const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courts = await prisma.court.findMany({ 
    include: { pricings: true, timeSlots: { take: 1 } },
    take: 1
  });
  console.log(JSON.stringify(courts, null, 2));

  if (courts.length > 0) {
    const c = courts[0];
    if (c.pricings.length > 0) {
      const p = c.pricings[0];
      console.log('Pricing start time getHours:', new Date(p.startTime).getHours());
      console.log('Pricing start time getUTCHours:', new Date(p.startTime).getUTCHours());
    }
    if (c.timeSlots.length > 0) {
      const slot = c.timeSlots[0];
      console.log('Slot start time getHours:', new Date(slot.startTime).getHours());
      console.log('Slot start time getUTCHours:', new Date(slot.startTime).getUTCHours());
    }
  }
}

main().finally(() => prisma.$disconnect());
