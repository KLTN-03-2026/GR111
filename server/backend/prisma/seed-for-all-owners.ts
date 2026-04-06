import { PrismaClient } from "../src/generated/prisma";
const prisma = new PrismaClient();

async function main() {
  const owners = await prisma.user.findMany({ where: { role: "OWNER" } });
  console.log(`Found ${owners.length} owners.`);

  for (const owner of owners) {
    let club = await prisma.club.findFirst({ where: { ownerId: owner.id } });
    if (!club) {
      console.log(`Creating club for owner ${owner.email}`);
      club = await prisma.club.create({
        data: {
          ownerId: owner.id,
          name: `Sân của ${owner.fullName}`,
          slug: `san-cua-${owner.id}`,
          address: "123 Test",
          district: "Test",
          city: "Test",
        },
      });
    }

    // Now seed customers to this club
    const usersToCreate = [
      {
        name: "Lê Văn Cường",
        phone: "0345888999",
        email: "cuong.le@outlook.com",
        tier: "SILVER",
        bookings: 15,
        spent: 4800000,
      },
      {
        name: "Phan Tuấn Anh",
        phone: "0912333888",
        email: "anh.phan@yahoo.com",
        tier: "VIP",
        bookings: 32,
        spent: 12500000,
      },
      {
        name: "Nguyễn Đình Vĩ",
        phone: "0987654321",
        email: "vi.nguyen@gmail.com",
        tier: "VIP",
        bookings: 85,
        spent: 45000000,
      },
    ];
    let court = await prisma.court.findFirst({ where: { clubId: club.id } });
    if (!court) {
      court = await prisma.court.create({
        data: {
          clubId: club.id,
          name: "Sân 1",
          sportType: "FOOTBALL",
          surface: "Đất",
          indoorOutdoor: "OUTDOOR",
        },
      });
    }
    let ts = await prisma.timeSlot.findFirst({ where: { courtId: court.id } });
    if (!ts) {
      ts = await prisma.timeSlot.create({
        data: {
          courtId: court.id,
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          status: "AVAILABLE",
        },
      });
    }

    for (const u of usersToCreate) {
      const userResult = await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          phone: u.phone,
          fullName: u.name,
          passwordHash: "bla",
          role: "USER",
        },
      });

      await prisma.clubCustomer.upsert({
        where: { clubId_userId: { clubId: club.id, userId: userResult.id } },
        update: {
          tier: u.tier as any,
          totalBookings: u.bookings,
          totalSpent: u.spent,
        },
        create: {
          clubId: club.id,
          userId: userResult.id,
          tier: u.tier as any,
          totalBookings: u.bookings,
          totalSpent: u.spent,
          notes: "Created for test",
        },
      });

      await prisma.booking.create({
        data: {
          userId: userResult.id,
          clubId: club.id,
          status: "COMPLETED",
          totalAmount: 300000,
          finalAmount: 300000,
          bookerName: u.name,
          bookerPhone: u.phone,
          items: { create: [{ timeSlotId: ts.id, price: 300000 }] },
        },
      });
    }
  }
}
main().finally(() => prisma.$disconnect());
