/**
 * Script seed dữ liệu test cho chức năng Voucher (Owner)
 * Chạy: npx tsx prisma/seed-vouchers-test.ts
 *
 * Script này KHÔNG xóa dữ liệu cũ — chỉ thêm voucher vào club đầu tiên
 * tìm thấy của owner vidinh@gmail.com
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🎟  Seeding voucher test data...\n");

  // 1. Tìm owner chính (vidinh@gmail.com)
  const owner = await prisma.user.findFirst({
    where: { email: "vidinh@gmail.com" },
  });

  if (!owner) {
    console.error("❌ Không tìm thấy owner vidinh@gmail.com.");
    console.error("   Hãy chạy `npm run seed:config` trước để tạo dữ liệu nền.");
    process.exit(1);
  }

  // 2. Lấy club đầu tiên của owner
  const club = await prisma.club.findFirst({
    where: { ownerId: owner.id, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!club) {
    console.error("❌ Owner chưa có câu lạc bộ nào.");
    process.exit(1);
  }

  console.log(`✅ Tìm thấy club: ${club.name} (${club.id})\n`);

  // 3. Xóa các voucher test cũ (theo prefix TEST_) của club này để tránh duplicate
  const deleted = await prisma.voucher.deleteMany({
    where: {
      clubId: club.id,
      code:   { startsWith: "TEST_" },
    },
  });
  if (deleted.count > 0) {
    console.log(`🗑  Đã xóa ${deleted.count} voucher test cũ.\n`);
  }

  // 4. Tạo bộ voucher test đa dạng
  const now = new Date();
  const past   = (days: number) => new Date(now.getTime() - days * 86_400_000);
  const future = (days: number) => new Date(now.getTime() + days * 86_400_000);

  const vouchers = [
    // ── Đang hoạt động ────────────────────────────────────────
    {
      clubId:        club.id,
      code:          "TEST_SUMMER2026",
      title:         "Khuyến mãi mùa hè",
      description:   "Giảm 20% cho tất cả các sân vào buổi sáng (6:00 – 12:00)",
      type:          "PERCENTAGE" as const,
      value:         20,
      minOrderAmount: 200_000,
      maxDiscount:   100_000,
      usageLimit:    100,
      usedCount:     45,
      usagePerUser:  1,
      startDate:     past(10),
      endDate:       future(60),
      isActive:      true,
    },
    {
      clubId:        club.id,
      code:          "TEST_NEWBIE50K",
      title:         "Ưu đãi khách mới",
      description:   "Giảm 50,000đ cho lần đặt sân đầu tiên",
      type:          "FIXED_AMOUNT" as const,
      value:         50_000,
      minOrderAmount: 150_000,
      maxDiscount:   null,
      usageLimit:    500,
      usedCount:     128,
      usagePerUser:  1,
      startDate:     past(30),
      endDate:       future(90),
      isActive:      true,
    },
    {
      clubId:        club.id,
      code:          "TEST_WEEKEND10",
      title:         "Giảm giá cuối tuần",
      description:   "Giảm 10% khi đặt sân vào Thứ 7 và Chủ nhật",
      type:          "PERCENTAGE" as const,
      value:         10,
      minOrderAmount: null,
      maxDiscount:   50_000,
      usageLimit:    200,
      usedCount:     12,
      usagePerUser:  2,
      startDate:     past(5),
      endDate:       future(30),
      isActive:      true,
    },
    {
      clubId:        club.id,
      code:          "TEST_VIP30",
      title:         "Đặc quyền VIP",
      description:   "Giảm 30% dành riêng cho khách hàng VIP",
      type:          "PERCENTAGE" as const,
      value:         30,
      minOrderAmount: 500_000,
      maxDiscount:   200_000,
      usageLimit:    50,
      usedCount:     8,
      usagePerUser:  5,
      startDate:     past(2),
      endDate:       future(14),
      isActive:      true,
    },
    {
      clubId:        club.id,
      code:          "TEST_FLASH100K",
      title:         "Flash Sale – Giảm ngay 100K",
      description:   "Áp dụng hôm nay, số lượng có hạn!",
      type:          "FIXED_AMOUNT" as const,
      value:         100_000,
      minOrderAmount: 300_000,
      maxDiscount:   null,
      usageLimit:    20,
      usedCount:     19, // gần hết
      usagePerUser:  1,
      startDate:     past(1),
      endDate:       future(1),
      isActive:      true,
    },
    // ── Không giới hạn lượt ───────────────────────────────────
    {
      clubId:        club.id,
      code:          "TEST_LOYALTY",
      title:         "Khách hàng thân thiết",
      description:   "Giảm 15% cho mọi đơn, không giới hạn lượt",
      type:          "PERCENTAGE" as const,
      value:         15,
      minOrderAmount: null,
      maxDiscount:   null,
      usageLimit:    null,
      usedCount:     234,
      usagePerUser:  99,
      startDate:     past(60),
      endDate:       future(120),
      isActive:      true,
    },
    // ── Tạm dừng (isActive: false) ────────────────────────────
    {
      clubId:        club.id,
      code:          "TEST_PAUSED",
      title:         "Chương trình tạm dừng",
      description:   "Voucher đang được review nội bộ",
      type:          "PERCENTAGE" as const,
      value:         25,
      minOrderAmount: 100_000,
      maxDiscount:   75_000,
      usageLimit:    100,
      usedCount:     0,
      usagePerUser:  1,
      startDate:     past(3),
      endDate:       future(45),
      isActive:      false,
    },
    // ── Đã hết hạn ────────────────────────────────────────────
    {
      clubId:        club.id,
      code:          "TEST_EXPIRED_TET",
      title:         "Khuyến mãi Tết 2026",
      description:   "Chương trình đã kết thúc",
      type:          "FIXED_AMOUNT" as const,
      value:         80_000,
      minOrderAmount: 200_000,
      maxDiscount:   null,
      usageLimit:    300,
      usedCount:     287,
      usagePerUser:  1,
      startDate:     past(90),
      endDate:       past(10),
      isActive:      true,
    },
    {
      clubId:        club.id,
      code:          "TEST_EXPIRED_OLD",
      title:         "Khuyến mãi cũ",
      description:   "Chương trình mùa hè 2025, đã hết hạn",
      type:          "PERCENTAGE" as const,
      value:         5,
      minOrderAmount: null,
      maxDiscount:   null,
      usageLimit:    500,
      usedCount:     412,
      usagePerUser:  2,
      startDate:     past(200),
      endDate:       past(60),
      isActive:      false,
    },
  ];

  let created = 0;
  for (const v of vouchers) {
    await prisma.voucher.create({ data: v });
    console.log(`  ✅  ${v.code.padEnd(22)} | ${v.type === 'PERCENTAGE' ? `-${v.value}%` : `-${v.value.toLocaleString()}đ`} | ${v.isActive ? (new Date(v.endDate) < now ? '⏰ Hết hạn' : '🟢 Hoạt động') : '⏸  Tạm dừng'}`);
    created++;
  }

  console.log(`\n🎉 Tạo thành công ${created} vouchers cho club "${club.name}"\n`);
  console.log("👤 Đăng nhập với:  vidinh@gmail.com / 14112004");
  console.log("📍 Vào trang:      /owner/vouchers");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed thất bại:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
