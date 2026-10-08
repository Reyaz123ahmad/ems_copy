import { prisma } from '../src/config/prisma.js';
import logger from '../src/config/logger.js';
import { startOfDayIST, formatDateIST } from '../src/utils/date.js';

/**
 * Script to clean up invalid ABSENT attendance records created before an employee's joining date.
 */
async function fixAbsentBeforeJoining() {
  console.log('--- Starting cleanup of ABSENT records prior to joining date ---');
  try {
    // 1. Fetch all ABSENT logs with employee details
    const absentLogs = await prisma.attendanceLog.findMany({
      where: {
        status: 'ABSENT'
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            joiningDate: true
          }
        }
      }
    });

    console.log(`Found ${absentLogs.length} total ABSENT records in database.`);

    const invalidLogIds = [];
    for (const log of absentLogs) {
      if (!log.employee || !log.employee.joiningDate) continue;

      const attendanceDay = startOfDayIST(log.attendanceDate);
      const joiningDay = startOfDayIST(log.employee.joiningDate);

      if (attendanceDay < joiningDay) {
        invalidLogIds.push(log.id);
        console.log(
          `Invalid ABSENT log: Employee ${log.employee.employeeCode} (${log.employee.firstName} ${log.employee.lastName}) ` +
          `joined on ${formatDateIST(joiningDay)} but has ABSENT record on ${formatDateIST(attendanceDay)} (ID: ${log.id})`
        );
      }
    }

    console.log(`Found ${invalidLogIds.length} invalid ABSENT records created before joining date.`);

    if (invalidLogIds.length > 0) {
      const deleteResult = await prisma.attendanceLog.deleteMany({
        where: {
          id: { in: invalidLogIds }
        }
      });
      console.log(`✅ Successfully deleted ${deleteResult.count} invalid ABSENT records.`);
    } else {
      console.log('✅ No invalid ABSENT records found. Database is clean.');
    }

    return { totalChecked: absentLogs.length, fixedCount: invalidLogIds.length };
  } catch (error) {
    console.error('❌ Error during cleanup script execution:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('fix-absent-before-joining.js')) {
  fixAbsentBeforeJoining()
    .then((res) => {
      console.log('Cleanup finished summary:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default fixAbsentBeforeJoining;
