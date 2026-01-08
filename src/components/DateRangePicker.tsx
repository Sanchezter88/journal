import { useEffect, useMemo, useState } from 'react';
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
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from 'date-fns';
import type { DateRange } from '../data/models';
import { getCurrentSessionDate } from '../utils/tradingDay';

interface DateRangePickerProps {
  initialRange: DateRange;
  onClose: () => void;
  onApply: (range: DateRange) => void;
}

type RangeState = { start: Date | null; end: Date | null };
type Preset = { label: string; getRange: () => RangeState };

const startOfToday = () => startOfDay(parseISO(getCurrentSessionDate()));

const clampToToday = (date: Date | null, today: Date) => {
  if (!date) return null;
  return isAfter(date, today) ? today : date;
};

const parseDateValue = (value: string | null, today: Date) => {
  if (!value) return null;
  return clampToToday(startOfDay(parseISO(value)), today);
};

const toIsoString = (value: Date | null) => (value ? format(value, 'yyyy-MM-dd') : null);

const buildPresets = (today: Date): Preset[] => [
  {
    label: 'Today',
    getRange: () => ({ start: today, end: today }),
  },
  {
    label: 'This Week',
    getRange: () => {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = clampToToday(endOfWeek(today, { weekStartsOn: 1 }), today)!;
      return { start, end };
    },
  },
  {
    label: 'This Month',
    getRange: () => ({ start: startOfMonth(today), end: clampToToday(endOfMonth(today), today)! }),
  },
  {
    label: 'Last 30 Days',
    getRange: () => ({ start: addDays(today, -29), end: today }),
  },
  {
    label: 'Last Month',
    getRange: () => {
      const prev = addMonths(today, -1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    },
  },
  {
    label: 'This Quarter',
    getRange: () => ({ start: startOfQuarter(today), end: clampToToday(endOfQuarter(today), today)! }),
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

const generateMatrix = (month: Date) => {
  const matrixStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  return Array.from({ length: 42 }).map((_, index) => {
    const date = addDays(matrixStart, index);
    return { date, currentMonth: date.getMonth() === month.getMonth() };
  });
};

const normalizeDay = (date: Date) => startOfDay(date);

const DateRangePicker = ({ initialRange, onClose, onApply }: DateRangePickerProps) => {
  const today = useMemo(() => startOfToday(), []);
  const [selection, setSelection] = useState<RangeState>(() => ({
    start: parseDateValue(initialRange.start, today),
    end: parseDateValue(initialRange.end, today),
  }));
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const presets = useMemo(() => buildPresets(today), [today]);
  const anchor = selection.start ?? selection.end ?? today;
  const [leftMonth, setLeftMonth] = useState(startOfMonth(anchor));

  useEffect(() => {
    if (!selection.start || selection.end) {
      setHoveredDay(null);
    }
  }, [selection.start, selection.end]);

  const applySelection = (next: RangeState) => {
    if (next.start && next.end && isAfter(next.start, next.end)) {
      setSelection({ start: next.end, end: next.start });
      return;
    }
    setSelection(next);
  };

  const handleDayClick = (rawDate: Date) => {
    if (isAfter(rawDate, today)) return;
    const day = normalizeDay(rawDate);
    setActivePreset(null);
    setSelection((current) => {
      if (!current.start || (current.start && current.end)) {
        return { start: day, end: null };
      }
      if (isBefore(day, current.start)) {
        return { start: day, end: current.start };
      }
      if (isSameDay(day, current.start)) {
        return { start: day, end: null };
      }
      return { start: current.start, end: day };
    });
  };

  const handleDayEnter = (rawDate: Date) => {
    if (!selection.start || selection.end || isAfter(rawDate, today)) return;
    setHoveredDay(normalizeDay(rawDate));
  };

  const handlePreset = (preset: Preset) => {
    const range = preset.getRange();
    setActivePreset(preset.label);
    applySelection({ start: range.start, end: range.end });
    const focus = range.start ?? range.end ?? today;
    setLeftMonth(startOfMonth(focus));
  };

  const handleApply = () => {
    const start = selection.start;
    const end = selection.end ?? selection.start;
    onApply({ start: toIsoString(start), end: toIsoString(end) });
    onClose();
  };

  const handleClear = () => {
    setSelection({ start: null, end: null });
    setActivePreset(null);
  };

  const getDisplayRange = () => {
    if (!selection.start) {
      return { start: null, end: null };
    }
    const endCandidate = selection.end ?? hoveredDay;
    if (!endCandidate) {
      return { start: selection.start, end: selection.start };
    }
    return isBefore(endCandidate, selection.start)
      ? { start: endCandidate, end: selection.start }
      : { start: selection.start, end: endCandidate };
  };

  const renderMonth = (month: Date) => {
    const days = generateMatrix(month);
    const { start, end } = getDisplayRange();
    const startMs = start ? start.getTime() : null;
    const endMs = end ? end.getTime() : null;

    return (
      <div className="date-picker-month" key={month.toISOString()}>
        <div className="date-picker-month-title">{format(month, 'MMMM yyyy')}</div>
        <div className="date-picker-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
            <div key={`${month.toISOString()}-${day}`} className="date-picker-weekday">
              {day}
            </div>
          ))}
          {days.map(({ date, currentMonth }) => {
            const normalized = normalizeDay(date);
            const time = normalized.getTime();
            const disabled = isAfter(normalized, today);
            const isStart = selection.start ? isSameDay(normalized, selection.start) : false;
            const provisionalEnd = selection.end
              ? selection.end
              : selection.start && hoveredDay
                ? hoveredDay
                : null;
            const isEnd = provisionalEnd
              ? !selection.start || !isSameDay(provisionalEnd, selection.start)
                ? isSameDay(normalized, provisionalEnd)
                : false
              : false;
            const inRange =
              startMs !== null && endMs !== null && time >= Math.min(startMs, endMs) && time <= Math.max(startMs, endMs);
            const classNames = [
              'date-picker-day',
              !currentMonth ? 'date-picker-day-out' : '',
              disabled ? 'date-picker-day-disabled' : '',
              inRange ? 'date-picker-day-range' : '',
              isStart ? 'date-picker-day-start' : '',
              isEnd ? 'date-picker-day-end' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                type="button"
                key={date.toISOString()}
                className={classNames}
                disabled={disabled}
                onClick={() => handleDayClick(date)}
                onMouseEnter={() => handleDayEnter(date)}
              >
                <span className="date-picker-day-label">{format(date, 'd')}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const nextMonth = addMonths(leftMonth, 1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="date-picker-panel" onClick={(event) => event.stopPropagation()}>
        <div className="date-picker-layout">
          <aside className="date-picker-sidebar">
            <p className="date-picker-sidebar-title">Quick ranges</p>
            <div className="date-picker-preset-list">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  className="date-picker-preset"
                  data-active={activePreset === preset.label}
                  onClick={() => handlePreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </aside>
          <div className="date-picker-body">
            <div className="date-picker-header">
              <button type="button" className="date-picker-nav" onClick={() => setLeftMonth(addMonths(leftMonth, -1))}>
                ‹
              </button>
              <div className="date-picker-header-label">
                {format(leftMonth, 'MMMM yyyy')} · {format(nextMonth, 'MMMM yyyy')}
              </div>
              <button
                type="button"
                className="date-picker-nav"
                onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
              >
                ›
              </button>
            </div>
            <div className="date-picker-months" onMouseLeave={() => setHoveredDay(null)}>
              {renderMonth(leftMonth)}
              {renderMonth(nextMonth)}
            </div>
            <div className="date-picker-footer">
              <button type="button" className="btn btn-muted" onClick={handleClear}>
                Clear
              </button>
              <button type="button" className="btn btn-accent" onClick={handleApply}>
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
