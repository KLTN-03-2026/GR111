import { prisma } from "../src/lib/prisma";
import { ApprovalStatus } from "../src/generated/prisma";

async function main() {
  const clubId = "cmnd1u8ac000059fh06j93xcp"; 
  console.log(`Checking club : ${clubId}`);
  
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) {
    console.error("Club not found!");
    return;
  }
  
  console.log(`Current status: ${club.approvalStatus}, isActive: ${club.isActive}`);
  
  try {
    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      }
    });
    console.log("Update SUCCESS:", updated.id, updated.approvalStatus);
  } catch (error) {
    console.error("Update ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
