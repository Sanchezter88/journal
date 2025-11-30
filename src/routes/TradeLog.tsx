import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TradesTable from '../components/TradesTable';
import TradeModal from '../components/TradeModal';
import type { TradeFormValues } from '../components/TradeModal';
import { useAuth } from '../auth/AuthContext';
import { useFilters } from '../data/filters/filtersContext';
import type { Trade } from '../data/models';
import { createTrade, deleteTrade, getTrades, updateTrade } from '../data/repositories/tradeRepository';
import { filterTrades, getDashboardSummary, getEquityCurveDaily } from '../data/services/statsService';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const PAGE_SIZE = 20;

const TradeLog = () => {
  const { currentUser } = useAuth();
  const { filters } = useFilters();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadTrades = async () => {
    if (!currentUser) return;
    setLoading(true);
    const data = await getTrades(currentUser.id);
    setTrades(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTrades();
  }, [currentUser?.id]);

  const summary = useMemo(() => getDashboardSummary(trades, filters), [trades, filters]);
  const equityCurve = useMemo(() => getEquityCurveDaily(trades, filters), [trades, filters]);
  const filteredTrades = useMemo(() => filterTrades(trades, filters), [trades, filters]);

  const searchedTrades = useMemo(() => {
    if (!search) return filteredTrades;
    return filteredTrades.filter((trade) => trade.instrument.toLowerCase().includes(search.toLowerCase()));
  }, [filteredTrades, search]);

  const paginatedTrades = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return searchedTrades.slice(start, start + PAGE_SIZE);
  }, [searchedTrades, page]);

  const totalPages = Math.max(1, Math.ceil(searchedTrades.length / PAGE_SIZE));

  const handleDeleteTrade = async (trade: Trade) => {
    if (!currentUser) return;
    const confirmed = window.confirm('Delete this trade?');
    if (!confirmed) return;
    await deleteTrade(currentUser.id, trade.id);
    await loadTrades();
  };

  const handleSubmit = async (values: TradeFormValues) => {
    if (!currentUser) return;
    if (editingTrade) {
      await updateTrade(currentUser.id, editingTrade.id, values);
    } else {
      await createTrade(currentUser.id, values);
    }
    await loadTrades();
  };

  const summaryCards = [
    {
      label: 'Net P&L',
      content: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.4rem', color: summary.netPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {summary.netPnl >= 0 ? '+' : '-'}${Math.abs(summary.netPnl).toFixed(0)}
          </div>
          <div style={{ width: '80px', height: '28px' }}>
            <ResponsiveContainer>
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area dataKey="cumulativePnl" stroke="var(--color-accent)" fill="url(#spark)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      label: 'Profit Factor',
      content: <div style={{ fontSize: '1.4rem' }}>{summary.profitFactor.toFixed(2)}</div>,
    },
    {
      label: 'Win Rate',
      content: <div style={{ fontSize: '1.4rem' }}>{summary.winRate.toFixed(1)}%</div>,
    },
    {
      label: 'Avg Win/Loss',
      content: (
        <div>
          <div style={{ fontSize: '1.4rem' }}>
            {summary.avgLoss === 0 ? summary.avgWin.toFixed(2) : (summary.avgWin / summary.avgLoss).toFixed(2)}
          </div>
          <div style={{ display: 'flex', height: '6px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(148,163,184,0.3)' }}>
            <span style={{ width: '50%', background: 'var(--color-success)' }} />
            <span style={{ width: '50%', background: 'var(--color-danger)' }} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="layout-grid" style={{ gap: '1.5rem' }}>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {summaryCards.map((card) => (
          <div key={card.label}>
            <p className="card-title" style={{ marginBottom: '0.35rem' }}>
              {card.label}
            </p>
            {card.content}
          </div>
        ))}
      </div>
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <input
          className="input"
          placeholder="Search instrument"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          style={{ flex: '1 1 240px' }}
        />
        <button
          className="btn btn-accent"
          onClick={() => {
            setEditingTrade(null);
            setModalOpen(true);
          }}
        >
          + Add Trade
        </button>
      </div>
      {loading ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-muted)' }}>Loading trades…</p>
        </div>
      ) : (
        <TradesTable
          trades={paginatedTrades}
          onEdit={(trade) => {
            setEditingTrade(trade);
            setModalOpen(true);
          }}
          onDelete={handleDeleteTrade}
          onViewDay={(date) => navigate(`/journal/${date}`)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--color-muted)' }}>
          Page {page} of {totalPages}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-muted" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
            Prev
          </button>
          <button className="btn btn-muted" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
            Next
          </button>
        </div>
      </div>

      {modalOpen ? (
        <TradeModal
          mode={editingTrade ? 'edit' : 'create'}
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
              : undefined
          }
          onClose={() => setModalOpen(false)}
          onSubmit={async (values) => {
            await handleSubmit(values);
            setModalOpen(false);
          }}
        />
      ) : null}
    </div>
  );
};

export default TradeLog;
