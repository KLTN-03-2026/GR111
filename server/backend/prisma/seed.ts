import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

const slugify = (text: string) => text.toString().toLowerCase().trim()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

const sportImages = {
  FOOTBALL: [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200",
    "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200",
    "https://images.unsplash.com/photo-1517466787929-bc9028880944?q=80&w=1200",
  ],
  BADMINTON: [
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200",
    "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1200",
    "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=1200",
  ],
  TENNIS: [
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200",
    "https://images.unsplash.com/photo-1622279457486-62dcc4a4603b?q=80&w=1200",
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200",
  ],
  PICKLEBALL: [
    "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200",
    "https://images.unsplash.com/photo-1544919396-d130b0d39b34?q=80&w=1200",
    "https://images.unsplash.com/photo-1519766428956-61327914a1c2?q=80&w=1200",
  ]
};

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Clean up existing data (Order matters)
  console.log("🗑 Cleaning up database...");
  await prisma.review.deleteMany();
  await prisma.post.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.clubCustomer.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.courtPricing.deleteMany();
  await prisma.specialDatePricing.deleteMany();
  await prisma.courtImage.deleteMany();
  await prisma.court.deleteMany();
  await prisma.clubAmenity.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.openingHour.deleteMany();
  await prisma.clubImage.deleteMany();
  await prisma.club.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Amenities
  console.log("➕ Creating amenities...");
  const wifi = await prisma.amenity.create({ data: { name: "WiFi", icon: "wifi" } });
  const parking = await prisma.amenity.create({ data: { name: "Bãi xe", icon: "car" } });
  const canteen = await prisma.amenity.create({ data: { name: "Căng tin", icon: "utensils" } });
  const shower = await prisma.amenity.create({ data: { name: "Phòng tắm", icon: "shower" } });

  // 3. Create Users
  console.log("👤 Creating users...");
  const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

  // Admin
  await prisma.user.create({
    data: {
      email: "admin@sportplatform.com",
      fullName: "Hệ thống Admin",
      passwordHash: hashedPassword,
      role: "ADMIN",
      profile: { create: { bio: "Quản trị viên hệ thống" } },
    },
  });

  const adminPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
  await prisma.user.create({
    data: {
      email: "admin@gmail.com",
      fullName: "Admin Test",
      passwordHash: adminPassword,
      role: "ADMIN",
      profile: { create: { bio: "Tài khoản hỗ trợ test" } },
    },
  });

  // Owners
  const hashedOwnerPassword = await bcrypt.hash("14112004", SALT_ROUNDS);
  const vidinhOwner = await prisma.user.create({
    data: {
      email: "vidinh@gmail.com",
      phone: "0388222333",
      fullName: "Nguyễn Đình Vĩ",
      passwordHash: hashedOwnerPassword,
      role: "OWNER",
      profile: { create: { address: "Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng", bio: "Hệ thống sân bóng chuyên nghiệp miền Trung" } },
    },
  });

  await prisma.user.create({
    data: {
      email: "owner1@gmail.com",
      phone: "0911111111",
      fullName: "Trần Văn Chủ",
      passwordHash: hashedPassword,
      role: "OWNER",
      profile: { create: { address: "123 Quận 1, TP.HCM" } },
    },
  });

  await prisma.user.create({
    data: {
      email: "owner2@gmail.com",
      phone: "0922222222",
      fullName: "Lê Thị Sân",
      passwordHash: hashedPassword,
      role: "OWNER",
      profile: { create: { address: "456 Quận 7, TP.HCM" } },
    },
  });

  // Regular Users
  const user1 = await prisma.user.create({
    data: {
      email: "user1@gmail.com",
      phone: "0933333333",
      fullName: "Nguyễn Văn Người Chơi",
      passwordHash: hashedPassword,
      role: "USER",
      profile: { create: { address: "789 Quận Bình Thạnh" } },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "user2@gmail.com",
      phone: "0944444444",
      fullName: "Phạm Thị Khách Hàng",
      passwordHash: hashedPassword,
      role: "USER",
      profile: { create: { address: "101 Quận 2" } },
    },
  });

  // 4. Create Clubs
  console.log("🏢 Creating clubs...");
  const club1 = await prisma.club.create({
    data: {
      ownerId: vidinhOwner.id, // Assign to new owner
      name: "Sân Bóng Thanh Đa Super",
      slug: "san-bong-thanh-da-super",
      address: "15 Thanh Đa",
      city: "Hồ Chí Minh",
      district: "Bình Thạnh",
      latitude: 10.8213,
      longitude: 106.7157,
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=ThanhDa",
      coverImageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200",
      approvalStatus: "APPROVED",
      amenities: {
        create: [
          { amenityId: wifi.id, note: "Sóng mạnh", price: 0 },
          { amenityId: parking.id, price: 10000 },
        ],
      },
      openingHours: {
        create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          dayOfWeek: day,
          openTime: new Date(Date.UTC(1970, 0, 1, 6, 0)),
          closeTime: new Date(Date.UTC(1970, 0, 1, 23, 0)),
        })),
      },
    },
  });

  const club2 = await prisma.club.create({
    data: {
      ownerId: vidinhOwner.id, // Assign to new owner
      name: "Cầu Lông Quận 7 Pro",
      slug: "cau-long-quan-7-pro",
      address: "100 Huỳnh Tấn Phát",
      city: "Hồ Chí Minh",
      district: "Quận 7",
      latitude: 10.7365,
      longitude: 106.7010,
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=Q7Pro",
      coverImageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200",
      approvalStatus: "APPROVED",
      amenities: {
        create: [
          { amenityId: shower.id, price: 5000 },
          { amenityId: canteen.id, price: 0 },
        ],
      },
      openingHours: {
        create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          dayOfWeek: day,
          openTime: new Date(Date.UTC(1970, 0, 1, 5, 0)),
          closeTime: new Date(Date.UTC(1970, 0, 1, 22, 0)),
        })),
      },
    },
  });

  const club3 = await prisma.club.create({
    data: {
      ownerId: vidinhOwner.id, // Assign to new owner
      name: "Tennis Thảo Điền Luxury",
      slug: "tennis-thao-dien-luxury",
      address: "24 Xuân Thủy",
      city: "Hồ Chí Minh",
      district: "Quận 2",
      latitude: 10.8042,
      longitude: 106.7367,
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=ThaoDien",
      coverImageUrl: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200",
      approvalStatus: "APPROVED",
      amenities: {
        create: [
          { amenityId: wifi.id, price: 0 },
          { amenityId: parking.id, price: 5000 },
          { amenityId: shower.id, price: 10000 },
        ],
      },
      openingHours: {
        create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          dayOfWeek: day,
          openTime: new Date(Date.UTC(1970, 0, 1, 6, 0)),
          closeTime: new Date(Date.UTC(1970, 0, 1, 21, 0)),
        })),
      },
    },
  });

  const club4 = await prisma.club.create({
    data: {
      ownerId: vidinhOwner.id, // Assign to new owner
      name: "Trung Tâm Pickleball & Basketball",
      slug: "pickleball-basketball-center",
      address: "50 Lê Lợi",
      city: "Hồ Chí Minh",
      district: "Quận 1",
      latitude: 10.7745,
      longitude: 106.7021,
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=PBCenter",
      coverImageUrl: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200",
      approvalStatus: "APPROVED",
      amenities: {
        create: [
          { amenityId: wifi.id, price: 0 },
          { amenityId: canteen.id, price: 0 },
        ],
      },
      openingHours: {
        create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          dayOfWeek: day,
          openTime: new Date(Date.UTC(1970, 0, 1, 7, 0)),
          closeTime: new Date(Date.UTC(1970, 0, 1, 23, 0)),
        })),
      },
    },
  });

  // 4a. Create 10 Da Nang Clubs
  console.log("🏢 Creating 10 Da Nang clubs...");
  const daNangClubDataList = [
    { name: "Sân bóng Chuyên Việt", district: "Hải Châu", address: "98 Tiểu La", lat: 16.0500, lng: 108.2100 },
    { name: "Sân bóng Tuyên Sơn", district: "Hải Châu", address: "01 Vũ Quang Thuận", lat: 16.0350, lng: 108.2250 },
    { name: "Sân bóng đá mini Duy Tân", district: "Hải Châu", address: "07 Duy Tân", lat: 16.0450, lng: 108.2200 },
    { name: "Sân cầu lông Kỳ Đồng", district: "Thanh Khê", address: "01 Kỳ Đồng", lat: 16.0650, lng: 108.1950 },
    { name: "Sân bóng Mỹ Gia", district: "Liên Chiểu", address: "P. Hòa Khánh Bắc", lat: 16.0750, lng: 108.1550 },
    { name: "Pickleball Đà Nẵng Club", district: "Sơn Trà", address: "Đường Hồ Nghinh", lat: 16.0700, lng: 108.2450 },
    { name: "Sân bóng Lê Quý Đôn", district: "Sơn Trà", address: "Đường Vũ Văn Dũng", lat: 16.0600, lng: 108.2400 },
    { name: "Sân bóng Ngũ Hành Sơn", district: "Ngũ Hành Sơn", address: "Đường Minh Mạng", lat: 16.0150, lng: 108.2550 },
    { name: "Trung tâm Thể thao Cẩm Lệ", district: "Cẩm Lệ", address: "P. Hòa Thọ Đông", lat: 16.0200, lng: 108.1900 },
    { name: "Sân bóng Hòa Xuân", district: "Cẩm Lệ", address: "Văn Tiến Dũng", lat: 15.9950, lng: 108.2150 },
  ];

  const daNangCourtIds: string[] = [];

  for (const info of daNangClubDataList) {
    const club = await prisma.club.create({
      data: {
        ownerId: vidinhOwner.id,
        name: info.name,
        slug: slugify(info.name) + "-" + Math.floor(Math.random() * 1000),
        address: info.address,
        city: "Đà Nẵng",
        district: info.district,
        latitude: info.lat,
        longitude: info.lng,
        logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${info.name}`,
        coverImageUrl: info.name.includes("cầu lông") ? sportImages.BADMINTON[0] : 
                       info.name.includes("Pickleball") ? sportImages.PICKLEBALL[0] : sportImages.FOOTBALL[0],
        approvalStatus: "APPROVED",
        amenities: {
          create: [
            { amenityId: wifi.id, price: 0 },
            { amenityId: parking.id, price: 5000 },
          ],
        },
        openingHours: {
          create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            dayOfWeek: day,
            openTime: new Date(Date.UTC(1970, 0, 1, 5, 0)),
            closeTime: new Date(Date.UTC(1970, 0, 1, 23, 0)),
          })),
        },
      },
    });

    for (let i = 1; i <= 3; i++) {
      const sportType = info.name.includes("cầu lông") ? "BADMINTON" : 
                        info.name.includes("Pickleball") ? "PICKLEBALL" : "FOOTBALL";
      
      const court = await prisma.court.create({
        data: {
          clubId: club.id,
          name: `Sân ${i}`,
          sportType: sportType as any,
          surface: sportType === "FOOTBALL" ? "Cỏ nhân tạo" : "Thảm chuyên dụng",
          indoorOutdoor: i % 2 === 0 ? "INDOOR" : "OUTDOOR",
          images: {
            create: sportImages[sportType as keyof typeof sportImages].map((url, idx) => ({
              url: url,
              caption: `Ảnh ${info.name} - Sân ${i} (${idx + 1})`,
              sortOrder: idx
            }))
          },
          pricings: {
            create: [
              { startTime: new Date(Date.UTC(1970, 0, 1, 5, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 16, 0)), pricePerHour: 150000, label: "Giờ thường" },
              { startTime: new Date(Date.UTC(1970, 0, 1, 16, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 23, 0)), pricePerHour: 300000, label: "Giờ cao điểm" },
            ],
          },
        },
      });
      daNangCourtIds.push(court.id);
    }
  }

  // 5. Create Courts & Pricing
  console.log("🏟 Creating courts and pricing...");

  // Football Courts
  const court1 = await prisma.court.create({
    data: {
      clubId: club1.id,
      name: "Sân 5 số 1 (Futsal)",
      sportType: "FOOTBALL",
      surface: "Cỏ nhân tạo",
      indoorOutdoor: "OUTDOOR",
      pricings: {
        create: [
          { startTime: new Date(Date.UTC(1970, 0, 1, 6, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 16, 0)), pricePerHour: 200000, label: "Giờ thường" },
          { startTime: new Date(Date.UTC(1970, 0, 1, 16, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 23, 0)), pricePerHour: 350000, label: "Giờ cao điểm" },
        ],
      },
    },
  });

  const courtF2 = await prisma.court.create({
    data: {
      clubId: club1.id,
      name: "Sân 7 số 1",
      sportType: "FOOTBALL",
      surface: "Cỏ nhân tạo",
      indoorOutdoor: "OUTDOOR",
      pricings: {
        create: [
          { startTime: new Date(Date.UTC(1970, 0, 1, 6, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 16, 0)), pricePerHour: 500000, label: "Giờ thường" },
          { startTime: new Date(Date.UTC(1970, 0, 1, 16, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 23, 0)), pricePerHour: 800000, label: "Giờ cao điểm" },
        ],
      },
    },
  });

  // Badminton Courts
  const court2 = await prisma.court.create({
    data: {
      clubId: club2.id,
      name: "Sân Thảm 1",
      sportType: "BADMINTON",
      surface: "Sàn gỗ",
      indoorOutdoor: "INDOOR",
      pricings: {
        create: [
          { startTime: new Date(Date.UTC(1970, 0, 1, 0, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 24, 0)), pricePerHour: 90000, label: "Đồng giá" },
        ],
      },
    },
  });

  const courtB2 = await prisma.court.create({
    data: {
      clubId: club2.id,
      name: "Sân Thảm 2 (VIP)",
      sportType: "BADMINTON",
      surface: "Thảm Yonex",
      indoorOutdoor: "INDOOR",
      pricings: {
        create: [
          { startTime: new Date(Date.UTC(1970, 0, 1, 0, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 24, 0)), pricePerHour: 120000, label: "Đồng giá" },
        ],
      },
    },
  });

  // Tennis Courts
  const courtT1 = await prisma.court.create({
    data: {
      clubId: club3.id,
      name: "Sân Tennis A",
      sportType: "TENNIS",
      surface: "Hard Court",
      indoorOutdoor: "OUTDOOR",
      pricings: {
        create: [
          { startTime: new Date(Date.UTC(1970, 0, 1, 6, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 17, 0)), pricePerHour: 200000, label: "Giờ sáng" },
          { startTime: new Date(Date.UTC(1970, 0, 1, 17, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 22, 0)), pricePerHour: 400000, label: "Giờ đèn" },
        ],
      },
    },
  });

  // Pickleball Courts
  const courtP1 = await prisma.court.create({
    data: {
      clubId: club4.id,
      name: "Pickleball 01",
      sportType: "PICKLEBALL",
      surface: "Acrylic",
      indoorOutdoor: "INDOOR",
      pricings: {
        create: [
          { startTime: new Date(Date.UTC(1970, 0, 1, 0, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 24, 0)), pricePerHour: 150000, label: "Đồng giá" },
        ],
      },
    },
  });

  // Basketball Courts
  const courtBB1 = await prisma.court.create({
    data: {
      clubId: club4.id,
      name: "Sân Bóng Rổ Trong Nhà",
      sportType: "BASKETBALL",
      surface: "Sàn gỗ xi bóng",
      indoorOutdoor: "INDOOR",
      pricings: {
        create: [
          { startTime: new Date(Date.UTC(1970, 0, 1, 0, 0)), endTime: new Date(Date.UTC(1970, 0, 1, 24, 0)), pricePerHour: 400000, label: "Thuê trọn sân" },
        ],
      },
    },
  });

  // 6. Create TimeSlots for today and tomorrow
  console.log("⏰ Creating time slots...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  async function createSlots(courtId: string, baseDate: Date, startHour = 6, endHour = 22) {
    for (let hour = startHour; hour < endHour; hour++) {
      await prisma.timeSlot.create({
        data: {
          courtId,
          startTime: new Date(new Date(baseDate).setHours(hour, 0, 0, 0)),
          endTime: new Date(new Date(baseDate).setHours(hour + 1, 0, 0, 0)),
          status: "AVAILABLE",
        },
      });
    }
  }

  const allCourtIds = [court1.id, courtF2.id, court2.id, courtB2.id, courtT1.id, courtP1.id, courtBB1.id, ...daNangCourtIds];

  for (const id of allCourtIds) {
    await createSlots(id, today);
    await createSlots(id, tomorrow);
  }

  // 7. Seed CRM data (ClubCustomer)
  console.log("💎 Seeding CRM data...");
  await prisma.clubCustomer.create({
    data: {
      clubId: club1.id,
      userId: user1.id,
      tier: "GOLD",
      totalBookings: 15,
      totalSpent: 4500000,
      notes: "Khách VIP, thích chọn sân số 1",
    },
  });

  await prisma.clubCustomer.create({
    data: {
      clubId: club1.id,
      userId: user2.id,
      tier: "NORMAL",
      totalBookings: 2,
      totalSpent: 600000,
      notes: "Cần chú ý lịch đặt giờ vàng",
    },
  });

  // 8. Seed Bookings
  console.log("📅 Creating bookings...");
  const court1Slots = await prisma.timeSlot.findMany({
    where: { courtId: court1.id, startTime: { gte: today, lt: tomorrow } },
    orderBy: { startTime: 'asc' }
  });

  const courtF2Slots = await prisma.timeSlot.findMany({
    where: { courtId: courtF2.id, startTime: { gte: today, lt: tomorrow } },
    orderBy: { startTime: 'asc' }
  });

  if (court1Slots.length > 2) {
    await prisma.booking.create({
      data: {
        userId: user1.id,
        clubId: club1.id,
        status: "CONFIRMED",
        totalAmount: 200000,
        finalAmount: 200000,
        bookerName: "Nguyễn Văn Người Chơi",
        bookerPhone: "0933333333",
        items: {
          create: [{ timeSlotId: court1Slots[2].id, price: 200000 }]
        }
      }
    });
    await prisma.timeSlot.update({ where: { id: court1Slots[2].id }, data: { status: "BOOKED" } });
  }

  if (court1Slots.length > 4) {
    await prisma.booking.create({
      data: {
        userId: user2.id,
        clubId: club1.id,
        status: "PENDING",
        totalAmount: 200000,
        finalAmount: 200000,
        bookerName: "Phạm Thị Khách Hàng",
        bookerPhone: "0944444444",
        items: {
          create: [{ timeSlotId: court1Slots[4].id, price: 200000 }]
        }
      }
    });
    await prisma.timeSlot.update({ where: { id: court1Slots[4].id }, data: { status: "LOCKED" } });
  }

  if (courtF2Slots.length > 12) {
    await prisma.booking.create({
      data: {
        userId: user1.id,
        clubId: club1.id,
        status: "COMPLETED",
        totalAmount: 800000,
        finalAmount: 800000,
        bookerName: "Khách Vãng Lai VIP",
        bookerPhone: "0999999999",
        items: {
          create: [{ timeSlotId: courtF2Slots[12].id, price: 800000 }]
        }
      }
    });
    await prisma.timeSlot.update({ where: { id: courtF2Slots[12].id }, data: { status: "BOOKED" } });
  }

  // Mock for court 2 (Badminton)
  const court2Slots = await prisma.timeSlot.findMany({
    where: { courtId: court2.id, startTime: { gte: today, lt: tomorrow } },
    orderBy: { startTime: 'asc' }
  });

  if (court2Slots.length > 13) {
    await prisma.booking.create({
      data: {
        userId: user2.id,
        clubId: club2.id,
        status: "CONFIRMED",
        totalAmount: 90000,
        finalAmount: 90000,
        bookerName: "Lê Văn Thể Lực",
        bookerPhone: "0988888888",
        items: {
          create: [{ timeSlotId: court2Slots[13].id, price: 90000 }] // 19:00
        }
      }
    });
    await prisma.timeSlot.update({ where: { id: court2Slots[13].id }, data: { status: "BOOKED" } });
  }

  // 9. Seed Posts (News Feed)
  console.log("✍️ Seeding posts...");
  await prisma.post.createMany({
    data: [
      { clubId: club1.id, title: "Giải bóng đá tứ hùng Thanh Đa", content: "Chào mừng các đội bóng tham gia giải đấu lớn nhất năm tại sân Thanh Đa Super.", type: "EVENT", status: "ACTIVE" },
      { clubId: club1.id, title: "Giảm giá 20% khung giờ sáng", content: "Đồng giá chỉ 150k cho các khung giờ từ 6h-10h sáng các ngày trong tuần.", type: "DISCOUNT", status: "ACTIVE" },
      { clubId: club2.id, title: "Khai trương sân thảm VIP mới", content: "Trải nghiệm sân thảm Yonex chuẩn quốc tế vừa được hoàn thiện tại Q7 Pro.", type: "ANNOUNCEMENT", status: "ACTIVE" },
    ]
  });

  // 10. Seed Vouchers
  console.log("🎫 Seeding vouchers...");
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 1);
  await prisma.voucher.createMany({
    data: [
      { clubId: club1.id, code: "THANHDA20", title: "Ưu đãi 20%", type: "PERCENTAGE", value: 20, startDate: new Date(), endDate: futureDate, usageLimit: 100 },
      { clubId: club2.id, code: "HELLO2026", title: "Chào mừng 2026", type: "FIXED_AMOUNT", value: 50000, startDate: new Date(), endDate: futureDate, usageLimit: 50 },
    ]
  });

  // 11. Seed Reviews
  console.log("⭐ Seeding reviews...");
  const recentBooking = await prisma.booking.findFirst({ where: { status: "COMPLETED" } });
  if (recentBooking) {
    await prisma.review.create({
      data: {
        userId: recentBooking.userId,
        bookingId: recentBooking.id,
        clubId: recentBooking.clubId,
        rating: 5,
        comment: "Sân rất đẹp, nhân viên phục vụ nhiệt tình. Sẽ quay lại!",
      }
    });
  }

  // 12. Seed Notifications
  console.log("🔔 Seeding notifications...");
  await prisma.notification.createMany({
    data: [
      { userId: vidinhOwner.id, title: "Yêu cầu rút tiền thành công", body: "Yêu cầu rút 5.000.000đ của bạn đã được xử lý.", type: "SYSTEM" },
      { userId: vidinhOwner.id, title: "Đơn đặt sân mới", body: "Có khách vừa đặt sân A1 khung giờ 18:00 hôm nay.", type: "BOOKING_CONFIRMED" },
    ]
  });

  // 13. Seed Special Pricing
  console.log("🏷 Seeding special pricing...");
  await prisma.specialDatePricing.create({
    data: {
      courtId: court1.id,
      specificDate: new Date(),
      startTime: new Date(Date.UTC(1970, 0, 1, 18, 0)),
      endTime: new Date(Date.UTC(1970, 0, 1, 22, 0)),
      pricePerHour: 500000,
      note: "Giá đặc biệt ngày lễ"
    }
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
