import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export function formatBeijingTime(value) {
  if (!value) return '—';
  return dayjs.utc(value).utcOffset(8).format('YYYY-MM-DD HH:mm');
}
