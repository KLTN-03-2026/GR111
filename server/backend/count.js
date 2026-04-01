console.log(await require('@/lib/prisma').prisma.club.count({ where: { approvalStatus: 'APPROVED' } }))
