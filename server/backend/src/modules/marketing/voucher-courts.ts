import { prisma } from "@/infra/db/prisma";

/** Không có bản ghi → áp dụng mọi sân của CLB. Có bản ghi → chỉ các sân được liệt kê. */
export async function replaceVoucherApplicableCourts(voucherId: string, clubId: string, courtIds: string[]) {
  await prisma.voucherCourt.deleteMany({ where: { voucherId } });
  if (courtIds.length === 0) return;

  const valid = await prisma.court.findMany({
    where: { clubId, id: { in: courtIds }, deletedAt: null },
    select: { id: true },
  });
  if (valid.length !== courtIds.length) throw new Error("INVALID_VOUCHER_COURTS");

  await prisma.voucherCourt.createMany({
    data: valid.map((c) => ({ voucherId, courtId: c.id })),
  });
}
