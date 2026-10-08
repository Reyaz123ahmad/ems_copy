import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const IST = 'Asia/Kolkata';

export const todayIST = () => dayjs().tz(IST).format('YYYY-MM-DD');

export const startOfDayIST = (date = new Date()) =>
  dayjs.tz(date, IST).startOf('day').toDate();

export const endOfDayIST = (date = new Date()) =>
  dayjs.tz(date, IST).endOf('day').toDate();

export const formatDateIST = (date = new Date()) =>
  dayjs(date).tz(IST).format('YYYY-MM-DD');

export default {
  IST,
  todayIST,
  startOfDayIST,
  endOfDayIST,
  formatDateIST,
};
