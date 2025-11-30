import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { AvgPnlPoint, WinRatePoint } from '../data/models';

type PnLTooltipProps = TooltipProps<number, string> & {
  payload?: ReadonlyArray<{ value: number | null }>;
};

interface TimeAndDayChartsGridProps {
  winRateByTime: WinRatePoint[];
  winRateByDay: WinRatePoint[];
  avgPnlByTime: AvgPnlPoint[];
  avgPnlByDay: AvgPnlPoint[];
}

const tooltipStyles = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(148,163,184,0.2)',
  padding: '0.5rem 0.75rem',
  borderRadius: '12px',
};

const renderPnLTooltip =
  (label: string) =>
  ({ active, payload }: PnLTooltipProps) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    const raw = payload[0].value as number | null | undefined;
    const hasValue = typeof raw === 'number' && Number.isFinite(raw);
    const color = !hasValue
      ? 'var(--color-muted)'
      : raw >= 0
        ? 'var(--color-success)'
        : 'var(--color-danger)';
    const display = !hasValue ? 'No trades' : `$${raw.toFixed(2)}`;
    return (
      <div style={tooltipStyles}>
        <div style={{ color, fontWeight: 600 }}>{`${label}: ${display}`}</div>
      </div>
    );
  };

const TimeAndDayChartsGrid = ({ winRateByTime, winRateByDay, avgPnlByTime, avgPnlByDay }: TimeAndDayChartsGridProps) => {
  return (
    <div
      className="layout-grid"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: '1.5rem' }}
    >
      <div className="card">
        <p className="card-title">Win Rate by Time</p>
        <div style={{ height: '220px' }}>
          <ResponsiveContainer>
            <BarChart data={winRateByTime}>
              <CartesianGrid strokeDasharray="3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" stroke="var(--color-muted)" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" />
              <YAxis stroke="var(--color-muted)" tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyles} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']} />
              <Bar dataKey="winRate" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <p className="card-title">Win Rate by Day</p>
        <div style={{ height: '220px' }}>
          <ResponsiveContainer>
            <BarChart data={winRateByDay}>
              <CartesianGrid strokeDasharray="3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--color-muted)" tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyles} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']} />
              <Bar dataKey="winRate" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <p className="card-title">Average P&L by Time</p>
        <div style={{ height: '220px' }}>
          <ResponsiveContainer>
            <BarChart data={avgPnlByTime}>
              <CartesianGrid strokeDasharray="3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" stroke="var(--color-muted)" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" />
              <YAxis stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 4" />
              <Tooltip content={renderPnLTooltip('Avg P&L')} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {avgPnlByTime.map((entry) => (
                  <Cell key={entry.label} fill={entry.value >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <p className="card-title">Average P&L by Day</p>
        <div style={{ height: '220px' }}>
          <ResponsiveContainer>
            <BarChart data={avgPnlByDay}>
              <CartesianGrid strokeDasharray="3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 4" />
              <Tooltip content={renderPnLTooltip('Avg P&L')} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {avgPnlByDay.map((entry) => (
                  <Cell key={entry.label} fill={entry.value >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TimeAndDayChartsGrid;
