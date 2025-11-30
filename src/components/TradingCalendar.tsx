import { addMonths, endOfMonth, endOfWeek, format, isAfter, startOfMonth, startOfWeek } from 'date-fns';
import { useMemo, useState } from 'react';
import type { DateRange } from '../data/models';

interface CalendarDayData {
  date: string;
  winCount: number;
  lossCount: number;
  pnl: number;
}

interface TradingCalendarProps {
  dateRange: DateRange;
  dayData: Record<string, CalendarDayData>;
  onSelectDate: (date: string) => void;
}

const today = new Date();

const buildCalendarDays = (month: Date) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  let current = start;
  while (!isAfter(current, end)) {
    days.push(new Date(current));
    current = new Date(current.getTime() + 86400000);
  }
  return days;
};

const TradingCalendar = ({ dateRange, dayData, onSelectDate }: TradingCalendarProps) => {
  const [month, setMonth] = useState(startOfMonth(today));

  const days = useMemo(() => buildCalendarDays(month), [month]);

  const handleSelect = (isoDate: string, disabled: boolean) => {
    if (disabled) return;
    onSelectDate(isoDate);
  };

  const isInRange = (isoDate: string) => {
    if (!dateRange.start && !dateRange.end) return true;
    if (dateRange.start && isoDate < dateRange.start) return false;
    if (dateRange.end && isoDate > dateRange.end) return false;
    return true;
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p className="card-title">Trading Calendar</p>
          <strong>{format(month, 'MMMM yyyy')}</strong>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={() => setMonth(addMonths(month, -1))}>
            ←
          </button>
          <button className="btn btn-ghost" onClick={() => setMonth(addMonths(month, 1))}>
            →
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            {day}
          </div>
        ))}
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const data = dayData[iso];
          const future = isAfter(day, today);
          const disabled = future || !isInRange(iso);
          const pnl = data?.pnl ?? 0;
          const winLossText = data ? `${data.winCount}W / ${data.lossCount}L` : 'No trades';
          const cellStyle: React.CSSProperties = {
            background: pnl > 0 ? 'rgba(34,197,94,0.1)' : pnl < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.08)',
            border: '1px solid rgba(148,163,184,0.1)',
          };
          const textColor = disabled ? 'rgba(148,163,184,0.4)' : '#fff';
          return (
            <button
              type="button"
              key={iso}
              className={`calendar-cell ${disabled ? 'calendar-cell-muted' : ''}`}
              style={{ ...cellStyle, color: textColor }}
              onClick={() => handleSelect(iso, disabled)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>{format(day, 'd')}</span>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>{format(day, 'EEE')}</span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{winLossText}</div>
              {data ? (
                <div style={{ fontSize: '0.85rem', color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(0)}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>--</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TradingCalendar;
