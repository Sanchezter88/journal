const pad = (value: number) => value.toString().padStart(2, '0');

const shiftIsoDate = (dateStr: string, days: number) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return dateStr;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

const minutesFromTime = (time?: string | null) => {
  if (!time) return 0;
  const [hourStr, minuteStr] = time.split(':');
  const hours = Number.parseInt(hourStr ?? '0', 10);
  const minutes = Number.parseInt(minuteStr ?? '0', 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const TRADING_DAY_CUTOFF_MINUTES = 18 * 60;

export const getSessionDate = (dateStr: string, timeStr?: string) => {
  if (!dateStr) return dateStr;
  const minutes = minutesFromTime(timeStr);
  if (minutes >= TRADING_DAY_CUTOFF_MINUTES) {
    return shiftIsoDate(dateStr, 1);
  }
  return dateStr;
};

const formatIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const getCurrentSessionDate = () => {
  const now = new Date();
  const isoDate = formatIsoDate(now);
  const time = formatTime(now);
  return getSessionDate(isoDate, time);
};
