import prisma from '../src/config/prisma.js';

async function backfillBiometricStatus() {
  console.log('=== Biometric Status Backfill Script ===');
  try {
    // 1. Find employees with face embedding or photo but missing faceRegisteredAt
    const employeesWithFaceData = await prisma.employee.findMany({
      where: {
        OR: [
          { faceEmbedding: { not: null } },
          { facePhotoUrl: { not: null } }
        ],
        faceRegisteredAt: null
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    console.log(`Found ${employeesWithFaceData.length} employees with face data but null faceRegisteredAt.`);

    let fixedCount = 0;
    for (const emp of employeesWithFaceData) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: {
          faceRegisteredAt: emp.createdAt || new Date()
        }
      });
      fixedCount++;
      console.log(`Updated employee ${emp.employeeCode} (${emp.firstName} ${emp.lastName})`);
    }

    // 2. Also check FaceRegistrationLog entries for any employees not yet marked
    const logs = await prisma.faceRegistrationLog.findMany({
      where: {
        action: { in: ['REGISTER', 'UPDATE', 'BULK_REGISTER'] }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        employeeId: true,
        createdAt: true,
        photoUrl: true,
        newEmbedding: true
      }
    });

    let logFixedCount = 0;
    for (const log of logs) {
      const emp = await prisma.employee.findUnique({
        where: { id: log.employeeId },
        select: { id: true, faceRegisteredAt: true }
      });

      if (emp && !emp.faceRegisteredAt) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: {
            faceRegisteredAt: log.createdAt || new Date(),
            ...(log.photoUrl ? { facePhotoUrl: log.photoUrl } : {}),
            ...(log.newEmbedding ? { faceEmbedding: log.newEmbedding } : {})
          }
        });
        logFixedCount++;
      }
    }

    console.log(`\nBackfill complete! Fixed from face data: ${fixedCount}, Fixed from registration logs: ${logFixedCount}`);
  } catch (err) {
    console.error('Error during biometric status backfill:', err);
  } finally {
    await prisma.$disconnect();
  }
}

backfillBiometricStatus();
