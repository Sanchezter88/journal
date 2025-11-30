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
import type { DailyPnlPoint, EquityCurvePoint } from '../data/models';

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

const getNiceStep = (maxValue: number) => {
  if (maxValue <= 0) {
    return 50;
  }
  const roughStep = maxValue / 4;
  const exponent = Math.floor(Math.log10(roughStep));
  const pow10 = Math.pow(10, exponent);
  const candidates = [1, 2, 5, 10];
  for (const candidate of candidates) {
    const step = pow10 * candidate;
    if (roughStep <= step) {
      return Math.max(50, step);
    }
  }
  return Math.max(50, pow10 * 10);
};

const getDailyTicks = (data: DailyPnlPoint[]) => {
  const values = data.map((entry) => entry.pnl ?? 0);
  const absMax = values.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  if (absMax === 0) return [0];
  const step = getNiceStep(absMax);
  const limit = Math.ceil(absMax / step) * step;
  const ticks: number[] = [];
  for (let value = -limit; value <= limit; value += step) {
    ticks.push(value);
  }
  if (!ticks.includes(0)) ticks.push(0);
  return ticks.sort((a, b) => a - b);
};

const PLChartsRow = ({ equityCurve, dailyPnl }: PLChartsRowProps) => {
  const dailyTicks = getDailyTicks(dailyPnl);
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
              <Tooltip
                contentStyle={tooltipStyles}
                formatter={(value: number) =>
                  value === null || value === undefined
                    ? ['No trades', 'Daily P&L']
                    : [`$${value.toFixed(2)}`, 'Daily P&L']
                }
              />
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
