import { smsQueue } from './sms.queue.js';
import { pushQueue } from './push.queue.js';
import { payrollQueue } from './payroll.queue.js';
import { attendanceQueue } from './attendance.queue.js';
import { reportQueue } from './report.queue.js';
import { aiQueue } from './ai.queue.js';
import logger from '../config/logger.js';

export const allQueues = [
  smsQueue,
  pushQueue,
  payrollQueue,
  attendanceQueue,
  reportQueue,
  aiQueue
];

/**
 * Gracefully close all BullMQ queues
 */
export async function closeAllQueues() {
  logger.info('Closing all BullMQ queues...');
  await Promise.all(allQueues.map((q) => q.close()));
  logger.info('All BullMQ queues closed successfully');
}

export {
  smsQueue,
  pushQueue,
  payrollQueue,
  attendanceQueue,
  reportQueue,
  aiQueue
};

export default {
  smsQueue,
  pushQueue,
  payrollQueue,
  attendanceQueue,
  reportQueue,
  aiQueue,
  allQueues,
  closeAllQueues
};
