import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TradesTable from '../components/TradesTable';
import TradeModal from '../components/TradeModal';
import type { TradeFormValues } from '../components/TradeModal';
import JournalNotes from '../components/JournalNotes';
import ScreenshotsSection from '../components/ScreenshotsSection';
import StrategyChecklist from '../components/StrategyChecklist';
import { useAuth } from '../auth/AuthContext';
import type { Trade, Screenshot } from '../data/models';
import { createTrade, getTrades, updateTrade } from '../data/repositories/tradeRepository';
import { getJournalEntry, upsertJournalEntry } from '../data/repositories/journalRepository';
import { addScreenshot, deleteScreenshot, getScreenshotsForDate } from '../data/repositories/screenshotRepository';
import { addDays, format, formatISO, isAfter, parseISO } from 'date-fns';
import { getCurrentSessionDate } from '../utils/tradingDay';

const readFileAsDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const DailyJournal = () => {
  const navigate = useNavigate();
  const { currentUser, currentAccount } = useAuth();
  const { date = '' } = useParams();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [notes, setNotes] = useState('');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const today = parseISO(getCurrentSessionDate());
  const parsedDate = date ? parseISO(date) : new Date();
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const previousDate = formatISO(addDays(safeDate, -1), { representation: 'date' });
  const nextDate = formatISO(addDays(safeDate, 1), { representation: 'date' });
  const nextDisabled = isAfter(addDays(safeDate, 1), today);
  const displayDate = format(safeDate, 'EEEE, MMM d, yyyy');

  const loadTrades = async () => {
    if (!currentUser || !currentAccount) return;
    setLoading(true);
    const allTrades = await getTrades(currentUser.id, currentAccount.id);
    setTrades(allTrades.filter((trade) => trade.date === date));
    setLoading(false);
  };

  const loadNotes = async () => {
    if (!currentUser || !currentAccount) return;
    const entry = await getJournalEntry(currentUser.id, currentAccount.id, date);
    setNotes(entry?.notes ?? '');
  };

  const loadScreenshots = async () => {
    if (!currentUser || !currentAccount) return;
    const list = await getScreenshotsForDate(currentUser.id, currentAccount.id, date);
    setScreenshots(list);
  };

  useEffect(() => {
    loadTrades();
    loadNotes();
    loadScreenshots();
  }, [currentUser?.id, currentAccount?.id, date]);

  const handleSaveNotes = async (value: string) => {
    if (!currentUser || !currentAccount) return;
    setNotes(value);
    await upsertJournalEntry(currentUser.id, currentAccount.id, date, value);
  };

  const handleTradeSubmit = async (values: TradeFormValues) => {
    if (!currentUser || !currentAccount) return;
    if (editingTrade) {
      await updateTrade(currentUser.id, currentAccount.id, editingTrade.id, values);
    } else {
      await createTrade(currentUser.id, currentAccount.id, { ...values, date });
    }
    await loadTrades();
  };

  const handleUploadScreenshots = async (files: FileList) => {
    if (!currentUser || !currentAccount) return;
    for (const file of Array.from(files)) {
      const fileUrl = await readFileAsDataUrl(file);
      await addScreenshot(currentUser.id, currentAccount.id, {
        date,
        fileUrl,
        description: file.name,
      });
    }
    await loadScreenshots();
  };

  const handleDeleteScreenshot = async (id: string) => {
    if (!currentUser || !currentAccount) return;
    await deleteScreenshot(currentUser.id, currentAccount.id, id);
    await loadScreenshots();
  };

  return (
    <div className="layout-grid" style={{ gap: '1.5rem' }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <p className="card-title">Daily Journal</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-ghost" type="button" onClick={() => navigate(`/journal/${previousDate}`)}>
              ←
            </button>
            <h2>{displayDate}</h2>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => navigate(`/journal/${nextDate}`)}
              disabled={nextDisabled}
            >
              →
            </button>
          </div>
        </div>
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
          trades={trades}
          showDate={false}
          onEdit={(trade) => {
            setEditingTrade(trade);
            setModalOpen(true);
          }}
        />
      )}
      <JournalNotes initialNotes={notes} onSave={handleSaveNotes} />
      <ScreenshotsSection screenshots={screenshots} onUpload={handleUploadScreenshots} onDelete={handleDeleteScreenshot} />
      {currentUser && currentAccount ? (
        <StrategyChecklist userId={currentUser.id} accountId={currentAccount.id} date={date} />
      ) : null}
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
              : { date, time: '09:30' }
          }
          onClose={() => setModalOpen(false)}
          onSubmit={async (values) => {
            await handleTradeSubmit(values);
            setModalOpen(false);
          }}
        />
      ) : null}
    </div>
  );
};

export default DailyJournal;
