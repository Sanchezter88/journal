import { useState } from 'react';
import {
  addDays,
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
  { label: 'Today', getRange: () => ({ start: today, end: today }) },
  {
    label: 'This Week',
    getRange: () => {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = clampToToday(endOfWeek(today, { weekStartsOn: 1 }));
      return { start, end };
    },
  },
  { label: 'This Month', getRange: () => ({ start: startOfMonth(today), end: clampToToday(endOfMonth(today)) }) },
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
  { label: 'This Quarter', getRange: () => ({ start: startOfQuarter(today), end: clampToToday(endOfQuarter(today)) }) },
  { label: 'Year To Date', getRange: () => ({ start: new Date(today.getFullYear(), 0, 1), end: today }) },
  { label: 'All Time', getRange: () => ({ start: null, end: null }) },
];

const formatValue = (date: Date | null) => (date ? format(date, 'yyyy-MM-dd') : null);

const generateCalendarMatrix = (month: Date) => {
  const start = startOfMonth(month);
  const startDay = start.getDay();
  const matrixStart = addDays(start, -startDay);
  return Array.from({ length: 42 }).map((_, index) => {
    const date = addDays(matrixStart, index);
    return { date, currentMonth: date.getMonth() === month.getMonth() };
  });
};

const DateRangePicker = ({ initialRange, onClose, onApply }: DateRangePickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(
    startOfMonth(initialRange.start ? parseISO(initialRange.start) : today)
  );
  const [selection, setSelection] = useState<{ start: Date | null; end: Date | null }>(() => ({
    start: initialRange.start ? parseISO(initialRange.start) : null,
    end: initialRange.end ? parseISO(initialRange.end) : null,
  }));

  const handleDayClick = (day: Date) => {
    if (isAfter(day, today)) return;
    if (!selection.start || (selection.start && selection.end)) {
      setSelection({ start: day, end: null });
      return;
    }
    if (selection.start && !selection.end) {
      if (isBefore(day, selection.start)) {
        setSelection({ start: day, end: selection.start });
      } else if (isSameDay(day, selection.start)) {
        setSelection({ start: day, end: null });
      } else {
        setSelection({ start: selection.start, end: day });
      }
    }
  };

  const handleApply = () => {
    onApply({ start: formatValue(selection.start), end: formatValue(selection.end) });
    onClose();
  };

  const handleClear = () => {
    setSelection({ start: null, end: null });
  };

  const normalize = (value: Date | null) =>
    value ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : null;

  const renderMonth = (month: Date) => {
    const days = generateCalendarMatrix(month);
    const startDate = normalize(selection.start);
    const endDate = normalize(selection.end);
    const startMs = startDate ? startDate.getTime() : null;
    const endMs = endDate ? endDate.getTime() : null;

    return (
      <div className="date-picker-month">
        <div className="date-picker-month-title">{format(month, 'MMMM yyyy')}</div>
        <div className="date-picker-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
            <div key={`${month.toISOString()}-${day}`} className="date-picker-weekday">
              {day}
            </div>
          ))}
          {days.map(({ date, currentMonth }) => {
            const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayMs = normalized.getTime();
            const disabled = isAfter(date, today);
            const isStart = startMs !== null && dayMs === startMs;
            const isEnd = endMs !== null && dayMs === endMs;
            const inRange =
              startMs !== null &&
              endMs !== null &&
              dayMs >= Math.min(startMs, endMs) &&
              dayMs <= Math.max(startMs, endMs);

            const className = [
              'date-picker-day',
              !currentMonth ? 'date-picker-day-out' : '',
              disabled ? 'date-picker-day-disabled' : '',
              inRange ? 'date-picker-day-range' : '',
              isStart ? 'date-picker-day-start' : '',
              isEnd ? 'date-picker-day-end' : '',
            ]
              .join(' ')
              .trim();

            return (
              <button
                type="button"
                key={date.toISOString()}
                className={className}
                disabled={disabled}
                onClick={() => handleDayClick(date)}
              >
                <span className="date-picker-day-label">{format(date, 'd')}</span>
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
                    setSelection({ start, end });
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
