import { useState } from 'react';
import {
  addMonths,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from 'date-fns';
import type { DateRange } from '../data/models';

interface DateRangePickerProps {
  initialRange: DateRange;
  onClose: () => void;
  onApply: (range: DateRange) => void;
}

const today = new Date();

const clampToToday = (date: Date) => (isAfter(date, today) ? today : date);

const presets = [
  {
    label: 'Today',
    getRange: () => ({ start: today, end: today }),
  },
  {
    label: 'This Week',
    getRange: () => {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = clampToToday(endOfWeek(today, { weekStartsOn: 1 }));
      return { start, end };
    },
  },
  {
    label: 'This Month',
    getRange: () => ({ start: startOfMonth(today), end: clampToToday(endOfMonth(today)) }),
  },
  {
    label: 'Last 30 Days',
    getRange: () => ({ start: new Date(today.getTime() - 29 * 86400000), end: today }),
  },
  {
    label: 'Last Month',
    getRange: () => {
      const previousMonth = addMonths(today, -1);
      return { start: startOfMonth(previousMonth), end: endOfMonth(previousMonth) };
    },
  },
  {
    label: 'This Quarter',
    getRange: () => ({ start: startOfQuarter(today), end: clampToToday(endOfQuarter(today)) }),
  },
  {
    label: 'Year To Date',
    getRange: () => ({ start: new Date(today.getFullYear(), 0, 1), end: today }),
  },
  {
    label: 'All Time',
    getRange: () => ({ start: null, end: null }),
  },
];

const formatValue = (date: Date | null) => (date ? format(date, 'yyyy-MM-dd') : null);

const buildWeeks = (month: Date) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  let current = start;
  while (!isAfter(current, end)) {
    days.push(current);
    current = new Date(current.getTime() + 86400000);
  }
  return days;
};

const DateRangePicker = ({ initialRange, onClose, onApply }: DateRangePickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(
    startOfMonth(initialRange.start ? parseISO(initialRange.start) : today)
  );
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>(() => ({
    start: initialRange.start ? parseISO(initialRange.start) : null,
    end: initialRange.end ? parseISO(initialRange.end) : null,
  }));

  const handleDayClick = (day: Date) => {
    if (isAfter(day, today)) return;
    if (!range.start || (range.start && range.end)) {
      setRange({ start: day, end: null });
      return;
    }
    if (range.start && !range.end) {
      if (isBefore(day, range.start)) {
        setRange({ start: day, end: range.start });
      } else {
        setRange({ start: range.start, end: day });
      }
    }
  };

  const handleApply = () => {
    onApply({ start: formatValue(range.start), end: formatValue(range.end) });
    onClose();
  };

  const handleClear = () => {
    setRange({ start: null, end: null });
  };

  const renderMonth = (month: Date) => {
    const days = buildWeeks(month);
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <strong>{format(month, 'MMMM yyyy')}</strong>
        </div>
        <div className="calendar-grid" style={{ gap: '0.25rem', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
            <div key={day} style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.8rem' }}>
              {day}
            </div>
          ))}
          {days.map((day) => {
            const disabled = isAfter(day, today);
            const isSelectedStart = range.start && isSameDay(range.start, day);
            const isSelectedEnd = range.end && isSameDay(range.end, day);
            const inRange =
              range.start &&
              range.end &&
              (isAfter(day, range.start) || isSameDay(day, range.start)) &&
              (isBefore(day, range.end) || isSameDay(day, range.end));
            const outMonth = day.getMonth() !== month.getMonth();
            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                disabled={disabled}
                style={{
                  borderRadius: isSelectedStart || isSelectedEnd ? '50%' : '12px',
                  padding: '0.35rem',
                  border: 'none',
                  background: isSelectedStart || isSelectedEnd
                    ? 'var(--color-accent)'
                    : inRange
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'transparent',
                  color: disabled
                    ? 'rgba(148,163,184,0.4)'
                    : outMonth
                      ? 'rgba(148,163,184,0.6)'
                      : '#fff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '880px' }} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
          <div style={{ borderRight: '1px solid rgba(148,163,184,0.2)', paddingRight: '1rem' }}>
            <p className="card-title" style={{ marginBottom: '0.5rem' }}>
              Presets
            </p>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  className="btn btn-muted"
                  onClick={() => {
                    const { start, end } = preset.getRange();
                    setRange({ start, end });
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                ←
              </button>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {renderMonth(currentMonth)}
                {renderMonth(addMonths(currentMonth, 1))}
              </div>
              <button className="btn btn-ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                →
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-muted" onClick={handleClear}>
                Clear
              </button>
              <button className="btn btn-accent" onClick={handleApply}>
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
