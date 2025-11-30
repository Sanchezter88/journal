import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { DailyPnlPoint, EquityCurvePoint } from '../data/models';

type PnLTooltipProps = TooltipProps<number, string> & {
  payload?: ReadonlyArray<{ value: number | null }>;
};

interface PLChartsRowProps {
  equityCurve: EquityCurvePoint[];
  dailyPnl: DailyPnlPoint[];
}

const tooltipStyles = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(148,163,184,0.2)',
  padding: '0.5rem 0.75rem',
  borderRadius: '12px',
};

const getNiceStep = (rangeValue: number) => {
  const abs = Math.abs(rangeValue);
  if (abs === 0) return 50;
  const roughStep = abs / 4;
  const exponent = Math.floor(Math.log10(roughStep));
  const pow10 = Math.pow(10, exponent);
  const candidates = [1, 2, 2.5, 5, 10];
  for (const candidate of candidates) {
    const step = pow10 * candidate;
    if (roughStep <= step) {
      return Math.max(25, step);
    }
  }
  return Math.max(25, pow10 * 10);
};

const buildAxisTicks = (data: DailyPnlPoint[]) => {
  const numericValues = data
    .map((entry) => entry.pnl)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (numericValues.length === 0) {
    return [0];
  }

  const minValue = Math.min(...numericValues, 0);
  const maxValue = Math.max(...numericValues, 0);

  const positiveStep = getNiceStep(maxValue);
  const negativeStep = getNiceStep(minValue);

  const maxLimit =
    maxValue === 0 ? positiveStep : Math.ceil(maxValue / positiveStep) * positiveStep;
  const minLimit =
    minValue === 0 ? -negativeStep : Math.floor(minValue / negativeStep) * negativeStep;

  const ticks: number[] = [];
  let cursor = minLimit;
  while (cursor <= maxLimit) {
    ticks.push(cursor);
    cursor += positiveStep;
  }
  if (!ticks.includes(0)) {
    ticks.push(0);
  }
  return ticks.sort((a, b) => a - b);
};

const renderValueTooltip =
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
        <div style={{ fontWeight: 600, color }}>{`${label}: ${display}`}</div>
      </div>
    );
  };

const PLChartsRow = ({ equityCurve, dailyPnl }: PLChartsRowProps) => {
  const dailyTicks = buildAxisTicks(dailyPnl);
  return (
    <div className="layout-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: '1.5rem' }}>
      <div className="card">
        <p className="card-title">Daily Net Cumulative P&L</p>
        <div style={{ height: '260px' }}>
          <ResponsiveContainer>
            <AreaChart data={equityCurve} margin={{ top: 10, left: -20 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="date" stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--color-muted)" tick={{ fontSize: 12 }} domain={[0, 'dataMax']} />
              <Tooltip
                contentStyle={tooltipStyles}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative P&L']}
              />
              <Area type="linear" dataKey="cumulativePnl" stroke="var(--color-accent)" fill="url(#equityGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <p className="card-title">Net Daily P&L</p>
        <div style={{ height: '260px' }}>
          <ResponsiveContainer>
            <BarChart data={dailyPnl} margin={{ top: 10, left: -20 }}>
              <CartesianGrid strokeDasharray="3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="date" stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
              <YAxis
                stroke="var(--color-muted)"
                tick={{ fontSize: 12 }}
                ticks={dailyTicks}
                domain={[dailyTicks[0] ?? 0, dailyTicks[dailyTicks.length - 1] ?? 0]}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 4" />
              <Tooltip content={renderValueTooltip('Daily P&L')} />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                {dailyPnl.map((entry) => (
                  <Cell
                    key={`cell-${entry.date}`}
                    fill={
                      entry.pnl === null
                        ? 'transparent'
                        : entry.pnl >= 0
                          ? 'var(--color-success)'
                          : 'var(--color-danger)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PLChartsRow;
