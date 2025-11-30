export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type TradeSide = 'LONG' | 'SHORT';
export type TradeResult = 'WIN' | 'LOSS' | 'BREAKEVEN';

export interface Trade {
  id: string;
  userId: string;
  date: string;
  time: string;
  instrument: string;
  side: TradeSide;
  result: TradeResult;
  contracts: number;
  riskRewardR: number;
  pnl: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyItem {
  id: string;
  strategyId: string;
  orderIndex: number;
  text: string;
}

export interface StrategyChecklistState {
  id: string;
  userId: string;
  date: string;
  strategyId: string;
  itemId: string;
  checked: boolean;
}

export interface Screenshot {
  id: string;
  userId: string;
  date: string;
  tradeId?: string;
  fileUrl: string;
  description?: string;
  createdAt: string;
}

export interface DateRange {
  start: string | null;
  end: string | null;
}

export type TimeRangeOption =
  | 'ALL'
  | '0930_0945'
  | '0945_1000'
  | '1000_1015'
  | '1015_1030'
  | '1030_PLUS';

export type DayOfWeekFilter = 'ALL' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

export interface FiltersState {
  dateRange: DateRange;
  timeRange: TimeRangeOption;
  dayOfWeek: DayOfWeekFilter;
  instrument: string | 'ALL';
}

export interface DashboardSummary {
  netPnl: number;
  winRate: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  profitFactor: number;
  totalWinning: number;
  totalLosing: number;
  avgRiskReward: number;
  avgWin: number;
  avgLoss: number;
}

export interface EquityCurvePoint {
  date: string;
  cumulativePnl: number;
}

export interface DailyPnlPoint {
  date: string;
  pnl: number | null;
}

export interface WinRatePoint {
  label: string;
  winRate: number;
}

export interface AvgPnlPoint {
  label: string;
  value: number;
}
