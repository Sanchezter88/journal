import { format, parseISO } from 'date-fns';
import { useFilters } from '../data/filters/filtersContext';

const instrumentOptions = ['ALL', 'NQ', 'ES', 'MNQ', 'MES', 'CL', 'GC', 'OTHER'];

interface FiltersBarProps {
  onOpenDatePicker: () => void;
}

const formatRangeLabel = (start: string | null, end: string | null) => {
  if (!start && !end) return 'All Dates';
  if (start && end) {
    return `${format(parseISO(start), 'MMM d, yyyy')} – ${format(parseISO(end), 'MMM d, yyyy')}`;
  }
  if (start) {
    return `${format(parseISO(start), 'MMM d, yyyy')} →`;
  }
  return `→ ${format(parseISO(end!), 'MMM d, yyyy')}`;
};

const FiltersBar = ({ onOpenDatePicker }: FiltersBarProps) => {
  const { filters, setTimeRange, setDayOfWeek, setInstrument, resetFilters } = useFilters();

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span className="card-title">Filters</span>
        <button className="btn btn-ghost" onClick={resetFilters}>
          Reset
        </button>
      </div>
      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <label className="label">
          Time Range
          <select className="select" value={filters.timeRange} onChange={(event) => setTimeRange(event.target.value as any)}>
            <option value="ALL">All Times</option>
            <option value="0930_0945">9:30–9:45</option>
            <option value="0945_1000">9:45–10:00</option>
            <option value="1000_1015">10:00–10:15</option>
            <option value="1015_1030">10:15–10:30</option>
            <option value="1030_PLUS">10:30+</option>
          </select>
        </label>
        <label className="label">
          Day Of Week
          <select className="select" value={filters.dayOfWeek} onChange={(event) => setDayOfWeek(event.target.value as any)}>
            <option value="ALL">All Days</option>
            <option value="MON">Monday</option>
            <option value="TUE">Tuesday</option>
            <option value="WED">Wednesday</option>
            <option value="THU">Thursday</option>
            <option value="FRI">Friday</option>
          </select>
        </label>
        <label className="label">
          Instrument
          <select className="select" value={filters.instrument} onChange={(event) => setInstrument(event.target.value as any)}>
            {instrumentOptions.map((option) => (
              <option value={option} key={option}>
                {option === 'ALL' ? 'All Instruments' : option}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="label" style={{ color: 'var(--color-muted)' }}>
            Date Range
          </span>
          <button
            className="btn btn-muted"
            style={{ width: '100%', justifyContent: 'space-between', display: 'flex' }}
            onClick={onOpenDatePicker}
          >
            <span>{formatRangeLabel(filters.dateRange.start, filters.dateRange.end)}</span>
            <span style={{ color: 'var(--color-muted)' }}>▾</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;
