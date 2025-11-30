import { addDays, addMonths, endOfMonth, endOfWeek, format, isAfter, startOfMonth, startOfWeek } from 'date-fns';
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

const buildWeeks = (month: Date) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const weeks: Date[][] = [];
  let current = start;
  while (!isAfter(current, end)) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(current);
      current = addDays(current, 1);
    }
    weeks.push(week);
  }
  return weeks;
};

const TradingCalendar = ({ dateRange, dayData, onSelectDate }: TradingCalendarProps) => {
  const [month, setMonth] = useState(startOfMonth(today));

  const weeks = useMemo(() => buildWeeks(month), [month]);

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
      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-grid calendar-grid-days">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const iso = format(day, 'yyyy-MM-dd');
            const data = dayData[iso];
            const future = isAfter(day, today);
            const disabled = future || !isInRange(iso);
            const pnl = data?.pnl ?? 0;
            const outMonth = day.getMonth() !== month.getMonth();
            const baseClass = [
              'calendar-cell',
              disabled ? 'calendar-cell-muted' : '',
              outMonth ? 'calendar-cell-outmonth' : '',
            ]
              .join(' ')
              .trim();
            const bgColor =
              pnl > 0 ? 'rgba(34,197,94,0.08)' : pnl < 0 ? 'rgba(239,68,68,0.08)' : 'rgba(148,163,184,0.05)';
            return (
              <button
                type="button"
                key={`${weekIndex}-${dayIndex}`}
                className={baseClass}
                disabled={disabled}
                style={{ background: bgColor }}
                onClick={() => handleSelect(iso, disabled)}
              >
                <div className="calendar-cell-header">
                  <span className="calendar-cell-date">{format(day, 'd')}</span>
                  <span className="calendar-cell-weekday">{format(day, 'EEE')}</span>
                </div>
                <div className="calendar-cell-body">
                  {data ? (
                    <>
                      <div className="calendar-cell-stats">
                        <span>{data.winCount}W</span>
                        <span>•</span>
                        <span>{data.lossCount}L</span>
                      </div>
                      <div
                        className="calendar-cell-pnl"
                        style={{ color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
                      >
                        {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(0)}
                      </div>
                    </>
                  ) : (
                    <span className="calendar-cell-empty">No trades</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TradingCalendar;
