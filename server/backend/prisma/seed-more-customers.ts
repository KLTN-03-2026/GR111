import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding more test customers...");
  
  // Find first available club
  let club = await prisma.club.findFirst();
  
  if (!club) {
    console.log("No club found. Creating a dummy club...");
    let owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
    if (!owner) {
      owner = await prisma.user.create({
        data: {
          email: "dummyowner@gmail.com",
          fullName: "Dummy Owner",
          role: "OWNER",
          passwordHash: await bcrypt.hash("password123", 10),
        }
      });
    }
    club = await prisma.club.create({
      data: {
        ownerId: owner.id,
        name: "Sân Bóng Test Hệ Thống",
        slug: "san-bong-test-he-thong-1",
        address: "123 Test",
        district: "Q1",
        city: "HCM",
      }
    });
  }
  
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const usersToCreate = [
    { name: "Lê Văn Cường", phone: "0345888999", email: "cuong.le@outlook.com", tier: "SILVER", bookings: 15, spent: 4800000 },
    { name: "Phan Tuấn Anh", phone: "0912333888", email: "anh.phan@yahoo.com", tier: "VIP", bookings: 32, spent: 12500000 },
    { name: "Hoàng Minh Thu", phone: "0901000111", email: "thu.hoang@gmail.com", tier: "NORMAL", bookings: 3, spent: 900000 },
    { name: "Nguyễn Đình Vĩ", phone: "0987654321", email: "vi.nguyen@gmail.com", tier: "VIP", bookings: 85, spent: 45000000 },
  ];

  for (const u of usersToCreate) {
    const userResult = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        phone: u.phone,
        fullName: u.name,
        passwordHash: hashedPassword,
        role: "USER"
      }
    });

    await prisma.clubCustomer.upsert({
      where: { clubId_userId: { clubId: club.id, userId: userResult.id } },
      update: { tier: u.tier as any, totalBookings: u.bookings, totalSpent: u.spent },
      create: {
        clubId: club.id,
        userId: userResult.id,
        tier: u.tier as any,
        totalBookings: u.bookings,
        totalSpent: u.spent,
        notes: `Seed data test cho ${u.name}`
      }
    });

    console.log(`✅ Created/Updated ${u.name} - Tier: ${u.tier}`);
    
    // Get a court to attach booking
    const court = await prisma.court.findFirst({ where: { clubId: club.id } });
    if (!court) continue;
    
    const ts = await prisma.timeSlot.findFirst({ where: { courtId: court.id }});
    if (!ts) continue;

    // Create a fake booking for history representation
    await prisma.booking.create({
      data: {
        userId: userResult.id,
        clubId: club.id,
        status: "COMPLETED",
        totalAmount: 300000,
        finalAmount: 300000,
        bookerName: u.name,
        bookerPhone: u.phone,
        createdAt: new Date(Date.now() - Math.random() * 10000000000), 
        items: {
          create: [{ timeSlotId: ts.id, price: 300000 }]
        }
      }
    });
  }
}

main().then(() => console.log('🎉 Done.')).catch(console.error).finally(() => prisma.$disconnect());
