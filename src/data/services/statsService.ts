import { eachDayOfInterval, formatISO, parseISO } from 'date-fns';
import type {
  AvgPnlPoint,
  DashboardSummary,
  DailyPnlPoint,
  DayOfWeekFilter,
  EquityCurvePoint,
  FiltersState,
  Trade,
  WinRatePoint,
} from '../models';
import { getSessionDate } from '../../utils/tradingDay';

const TIME_BUCKETS = [
  { key: '0930_0945', label: '9:30-9:45', start: 9 * 60 + 30, end: 9 * 60 + 45 },
  { key: '0945_1000', label: '9:45-10:00', start: 9 * 60 + 45, end: 10 * 60 },
  { key: '1000_1015', label: '10:00-10:15', start: 10 * 60, end: 10 * 60 + 15 },
  { key: '1015_1030', label: '10:15-10:30', start: 10 * 60 + 15, end: 10 * 60 + 30 },
  { key: '1030_PLUS', label: '10:30+', start: 10 * 60 + 30, end: Infinity },
] as const;

type Weekday = Exclude<DayOfWeekFilter, 'ALL'>;

const DAY_LABELS: Record<Weekday, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
};

const todayIso = () => formatISO(new Date(), { representation: 'date' });

const toIsoDate = (date: Date) => formatISO(date, { representation: 'date' });

const resolveRangeBounds = (filters: FiltersState, tradeDates: string[]) => {
  const today = todayIso();
  const firstTrade = tradeDates[0] ?? today;
  const lastTrade = tradeDates[tradeDates.length - 1] ?? today;
  let start = filters.dateRange.start ?? firstTrade;
  let end = filters.dateRange.end ?? lastTrade;
  if (end > today) {
    end = today;
  }
  if (start > today) {
    start = today;
  }
  if (start > end) {
    start = end;
  }
  return { start, end };
};

const buildContinuousDates = (filters: FiltersState, tradeDates: string[]) => {
  const { start, end } = resolveRangeBounds(filters, tradeDates);
  const range = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
  return range.map((day) => toIsoDate(day));
};

const parseMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const getDayCode = (dateStr: string): DayOfWeekFilter | 'WEEKEND' => {
  const date = parseISO(dateStr);
  const day = date.getDay();
  switch (day) {
    case 1:
      return 'MON';
    case 2:
      return 'TUE';
    case 3:
      return 'WED';
    case 4:
      return 'THU';
    case 5:
      return 'FRI';
    default:
      return 'WEEKEND';
  }
};

export const filterTrades = (trades: Trade[], filters: FiltersState): Trade[] => {
  const today = todayIso();
  return trades.filter((trade) => {
    const sessionDate = getSessionDate(trade.date, trade.time);
    if (sessionDate > today) return false;
    const { dateRange, timeRange, dayOfWeek, instrument } = filters;

    if (dateRange.start && sessionDate < dateRange.start) return false;
    if (dateRange.end && sessionDate > dateRange.end) return false;

    if (instrument !== 'ALL' && trade.instrument !== instrument) return false;

    if (timeRange !== 'ALL') {
      const bucket = TIME_BUCKETS.find((b) => b.key === timeRange);
      if (bucket) {
        const minutes = parseMinutes(trade.time);
        if (!(minutes >= bucket.start && minutes < bucket.end)) {
          return false;
        }
      }
    }

    if (dayOfWeek !== 'ALL') {
      const tradeDay = getDayCode(sessionDate);
      if (tradeDay !== dayOfWeek) return false;
    }

    return true;
  });
};

const roundTwo = (value: number) => Math.round(value * 100) / 100;

export const getDashboardSummary = (trades: Trade[], filters: FiltersState): DashboardSummary => {
  const filtered = filterTrades(trades, filters);
  if (filtered.length === 0) {
    return {
      netPnl: 0,
      winRate: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      profitFactor: 0,
      totalWinning: 0,
      totalLosing: 0,
      avgRiskReward: 0,
      avgWin: 0,
      avgLoss: 0,
    };
  }

  const netPnl = filtered.reduce((sum, trade) => sum + trade.pnl, 0);
  const winTrades = filtered.filter((trade) => trade.result === 'WIN');
  const lossTrades = filtered.filter((trade) => trade.result === 'LOSS');
  const breakevenCount = filtered.filter((trade) => trade.result === 'BREAKEVEN').length;
  const winCount = winTrades.length;
  const lossCount = lossTrades.length;
  const totalWinning = winTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const totalLosing = lossTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const profitFactor = totalLosing === 0 ? totalWinning : totalWinning / Math.abs(totalLosing);
  const avgRiskReward = filtered.reduce((sum, trade) => sum + trade.riskRewardR, 0) / filtered.length;
  const avgWin = winCount ? totalWinning / winCount : 0;
  const avgLoss = lossCount ? Math.abs(totalLosing) / lossCount : 0;

  const winRateDenominator = winCount + lossCount;
  const winRate = winRateDenominator ? (winCount / winRateDenominator) * 100 : 0;

  return {
    netPnl: roundTwo(netPnl),
    winRate: Math.round(winRate * 10) / 10,
    winCount,
    lossCount,
    breakevenCount,
    profitFactor: roundTwo(profitFactor),
    totalWinning: roundTwo(totalWinning),
    totalLosing: roundTwo(totalLosing),
    avgRiskReward: roundTwo(avgRiskReward),
    avgWin: roundTwo(avgWin),
    avgLoss: roundTwo(avgLoss),
  };
};

const groupByDate = (trades: Trade[]) => {
  const map = new Map<string, number>();
  trades.forEach((trade) => {
    const sessionDate = getSessionDate(trade.date, trade.time);
    map.set(sessionDate, (map.get(sessionDate) ?? 0) + trade.pnl);
  });
  return map;
};

export const getEquityCurveDaily = (trades: Trade[], filters: FiltersState): EquityCurvePoint[] => {
  const filtered = filterTrades(trades, filters);
  const grouped = groupByDate(filtered);
  const tradeDates = Array.from(new Set(filtered.map((trade) => getSessionDate(trade.date, trade.time)))).sort();
  const days = buildContinuousDates(filters, tradeDates);
  if (days.length === 0) return [];
  let cumulative = 0;
  return days.map((date) => {
    cumulative += grouped.get(date) ?? 0;
    return { date, cumulativePnl: roundTwo(cumulative) };
  });
};

export const getDailyPnl = (trades: Trade[], filters: FiltersState): DailyPnlPoint[] => {
  const filtered = filterTrades(trades, filters);
  const grouped = groupByDate(filtered);
  const tradeDates = Array.from(new Set(filtered.map((trade) => getSessionDate(trade.date, trade.time)))).sort();
  const days = buildContinuousDates(filters, tradeDates);
  if (days.length === 0) return [];
  return days.map((date) => {
    const pnlValue = grouped.get(date);
    return { date, pnl: pnlValue === undefined ? null : roundTwo(pnlValue) };
  });
};

const aggregateByTimeBucket = (trades: Trade[]) => {
  const map = new Map<string, Trade[]>();
  trades.forEach((trade) => {
    const minutes = parseMinutes(trade.time);
    const bucket = TIME_BUCKETS.find((b) => minutes >= b.start && minutes < b.end);
    if (!bucket) return;
    const arr = map.get(bucket.key) ?? [];
    arr.push(trade);
    map.set(bucket.key, arr);
  });
  return map;
};

export const getWinRateByTimeBucket = (trades: Trade[], filters: FiltersState): WinRatePoint[] => {
  const filtered = filterTrades(trades, filters);
  const map = aggregateByTimeBucket(filtered);
  return TIME_BUCKETS.map((bucket) => {
    const bucketTrades = map.get(bucket.key) ?? [];
    const wins = bucketTrades.filter((trade) => trade.result === 'WIN').length;
    const losses = bucketTrades.filter((trade) => trade.result === 'LOSS').length;
    const denom = wins + losses;
    const winRate = denom ? (wins / denom) * 100 : 0;
    return { label: bucket.label, winRate: Math.round(winRate * 10) / 10 };
  });
};

export const getAvgPnlByTimeBucket = (trades: Trade[], filters: FiltersState): AvgPnlPoint[] => {
  const filtered = filterTrades(trades, filters);
  const map = aggregateByTimeBucket(filtered);
  return TIME_BUCKETS.map((bucket) => {
    const bucketTrades = map.get(bucket.key) ?? [];
    const value = bucketTrades.length
      ? bucketTrades.reduce((sum, trade) => sum + trade.pnl, 0) / bucketTrades.length
      : 0;
    return { label: bucket.label, value: roundTwo(value) };
  });
};

const aggregateByDay = (trades: Trade[]) => {
  const map = new Map<Weekday, Trade[]>();
  trades.forEach((trade) => {
    const day = getDayCode(getSessionDate(trade.date, trade.time));
    if (day === 'WEEKEND') return;
    const arr = map.get(day as Weekday) ?? [];
    arr.push(trade);
    map.set(day as Weekday, arr);
  });
  return map;
};

export const getWinRateByDayOfWeek = (trades: Trade[], filters: FiltersState): WinRatePoint[] => {
  const filtered = filterTrades(trades, filters);
  const map = aggregateByDay(filtered);
  return (Object.keys(DAY_LABELS) as Weekday[]).map((day) => {
    const dayTrades = map.get(day) ?? [];
    const wins = dayTrades.filter((trade) => trade.result === 'WIN').length;
    const losses = dayTrades.filter((trade) => trade.result === 'LOSS').length;
    const denom = wins + losses;
    const winRate = denom ? (wins / denom) * 100 : 0;
    return { label: DAY_LABELS[day], winRate: Math.round(winRate * 10) / 10 };
  });
};

export const getAvgPnlByDayOfWeek = (trades: Trade[], filters: FiltersState): AvgPnlPoint[] => {
  const filtered = filterTrades(trades, filters);
  const map = aggregateByDay(filtered);
  return (Object.keys(DAY_LABELS) as Weekday[]).map((day) => {
    const dayTrades = map.get(day) ?? [];
    const value = dayTrades.length ? dayTrades.reduce((sum, trade) => sum + trade.pnl, 0) / dayTrades.length : 0;
    return { label: DAY_LABELS[day], value: roundTwo(value) };
  });
};
