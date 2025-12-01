import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import FiltersBar from '../components/FiltersBar';
import DateRangePicker from '../components/DateRangePicker';
import SummaryCards from '../components/SummaryCards';
import PLChartsRow from '../components/PLChartsRow';
import TimeAndDayChartsGrid from '../components/TimeAndDayChartsGrid';
import TradingCalendar from '../components/TradingCalendar';
import TradeModal from '../components/TradeModal';
import type { TradeFormValues } from '../components/TradeModal';
import { useAuth } from '../auth/AuthContext';
import { useFilters } from '../data/filters/filtersContext';
import type { Trade } from '../data/models';
import { createTrade, getTrades, updateTrade } from '../data/repositories/tradeRepository';
import {
  filterTrades,
  getAvgPnlByDayOfWeek,
  getAvgPnlByTimeBucket,
  getDailyPnl,
  getDashboardSummary,
  getEquityCurveDaily,
  getWinRateByDayOfWeek,
  getWinRateByTimeBucket,
} from '../data/services/statsService';

const Dashboard = () => {
  const { currentUser, currentAccount } = useAuth();
  const navigate = useNavigate();
  const { filters, setDateRange } = useFilters();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const loadTrades = async () => {
    if (!currentUser || !currentAccount) return;
    setLoading(true);
    const data = await getTrades(currentUser.id, currentAccount.id);
    setTrades(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTrades();
  }, [currentUser?.id, currentAccount?.id]);

  const summary = useMemo(() => getDashboardSummary(trades, filters), [trades, filters]);
  const equityCurve = useMemo(() => getEquityCurveDaily(trades, filters), [trades, filters]);
  const dailyPnl = useMemo(() => getDailyPnl(trades, filters), [trades, filters]);
  const winRateByTime = useMemo(() => getWinRateByTimeBucket(trades, filters), [trades, filters]);
  const winRateByDay = useMemo(() => getWinRateByDayOfWeek(trades, filters), [trades, filters]);
  const avgPnlByTime = useMemo(() => getAvgPnlByTimeBucket(trades, filters), [trades, filters]);
  const avgPnlByDay = useMemo(() => getAvgPnlByDayOfWeek(trades, filters), [trades, filters]);
  const filteredTrades = useMemo(() => filterTrades(trades, filters), [trades, filters]);

  const dayData = useMemo(() => {
    const map: Record<string, { date: string; winCount: number; lossCount: number; pnl: number }> = {};
    filteredTrades.forEach((trade) => {
      if (!map[trade.date]) {
        map[trade.date] = { date: trade.date, winCount: 0, lossCount: 0, pnl: 0 };
      }
      if (trade.result === 'WIN') map[trade.date].winCount += 1;
      if (trade.result === 'LOSS') map[trade.date].lossCount += 1;
      map[trade.date].pnl += trade.pnl;
    });
    return map;
  }, [filteredTrades]);

  const handleCreateTrade = async (values: TradeFormValues) => {
    if (!currentUser || !currentAccount) return;
    await createTrade(currentUser.id, currentAccount.id, values);
    await loadTrades();
  };

  const handleUpdateTrade = async (values: TradeFormValues) => {
    if (!currentUser || !currentAccount || !editingTrade) return;
    await updateTrade(currentUser.id, currentAccount.id, editingTrade.id, values);
    await loadTrades();
  };

  const modalMode = editingTrade ? 'edit' : 'create';

  return (
    <div>
      <Header
        title="Trading Journal"
        subtitle="Track and analyze your trading performance."
        onAddTrade={() => {
          setEditingTrade(null);
          setModalOpen(true);
        }}
      />
      <FiltersBar onOpenDatePicker={() => setDatePickerOpen(true)} />
      {loading ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-muted)' }}>Loading trades…</p>
        </div>
      ) : (
        <>
          <SummaryCards summary={summary} />
          <PLChartsRow equityCurve={equityCurve} dailyPnl={dailyPnl} />
          <TimeAndDayChartsGrid
            winRateByTime={winRateByTime}
            winRateByDay={winRateByDay}
            avgPnlByTime={avgPnlByTime}
            avgPnlByDay={avgPnlByDay}
          />
          <TradingCalendar
            dateRange={filters.dateRange}
            dayData={dayData}
            onSelectDate={(date) => navigate(`/journal/${date}`)}
          />
        </>
      )}

      {modalOpen ? (
        <TradeModal
          mode={modalMode}
          initialValues={
            editingTrade
              ? {
                  date: editingTrade.date,
                  time: editingTrade.time,
                  contracts: editingTrade.contracts,
                  side: editingTrade.side,
                  instrument: editingTrade.instrument,
                  result: editingTrade.result,
                  riskRewardR: editingTrade.riskRewardR,
                  pnl: editingTrade.pnl,
                }
              : { date: filters.dateRange.end ?? new Date().toISOString().slice(0, 10) }
          }
          onClose={() => setModalOpen(false)}
          onSubmit={modalMode === 'create' ? handleCreateTrade : handleUpdateTrade}
        />
      ) : null}
      {datePickerOpen ? (
        <DateRangePicker initialRange={filters.dateRange} onClose={() => setDatePickerOpen(false)} onApply={setDateRange} />
      ) : null}
    </div>
  );
};

export default Dashboard;
