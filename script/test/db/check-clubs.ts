import { PrismaClient } from "./src/generated/prisma";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { role: 'OWNER' }});
  console.log("OWNERS:", users.map(u => ({ id: u.id, email: u.email, name: u.fullName })));
  
  const clubs = await prisma.club.findMany();
  console.log("CLUBS:", clubs.map(c => ({ id: c.id, ownerId: c.ownerId, name: c.name })));

  const customers = await prisma.clubCustomer.findMany();
  console.log("CUSTOMERS SEEDED:", customers.length);
}
main().finally(() => prisma.$disconnect());
