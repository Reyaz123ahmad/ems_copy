import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const IST = 'Asia/Kolkata';

export const todayIST = () => dayjs().tz(IST).format('YYYY-MM-DD');

export const startOfDayIST = (date = new Date()) => {
  const dStr = dayjs(date).tz(IST).format('YYYY-MM-DD');
  return new Date(`${dStr}T00:00:00.000Z`);
};

export const endOfDayIST = (date = new Date()) => {
  const dStr = dayjs(date).tz(IST).format('YYYY-MM-DD');
  return new Date(`${dStr}T23:59:59.999Z`);
};

export const formatDateIST = (date = new Date()) =>
  dayjs(date).tz(IST).format('YYYY-MM-DD');

export default {
  IST,
  todayIST,
  startOfDayIST,
  endOfDayIST,
  formatDateIST,
};
