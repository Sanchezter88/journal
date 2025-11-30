import type { DashboardSummary } from '../data/models';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const totalTrades = summary.winCount + summary.lossCount + summary.breakevenCount;
  const winLossWidth = totalTrades ? (summary.winCount / totalTrades) * 100 : 0;
  const lossWidth = totalTrades ? (summary.lossCount / totalTrades) * 100 : 0;
  const avgLossDisplay = summary.avgLoss === 0 ? '0.00' : summary.avgLoss.toFixed(2);
  const avgWinDisplay = summary.avgWin === 0 ? '0.00' : summary.avgWin.toFixed(2);
  const ratio = summary.avgLoss === 0 ? summary.avgWin : summary.avgWin / summary.avgLoss;

  const cards = [
    {
      title: 'Net P&L',
      content: (
        <div>
          <div
            style={{
              fontSize: '2rem',
              color: summary.netPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
              fontWeight: 700,
            }}
          >
            {summary.netPnl >= 0 ? '+' : '-'}${Math.abs(summary.netPnl).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Trade Win Rate',
      content: (
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.winRate.toFixed(1)}%</div>
          <div
            style={{
              display: 'flex',
              height: '10px',
              borderRadius: '999px',
              overflow: 'hidden',
              background: 'rgba(148,163,184,0.2)',
              marginTop: '0.5rem',
            }}
          >
            <span style={{ width: `${winLossWidth}%`, background: 'var(--color-success)' }} />
            <span style={{ width: `${lossWidth}%`, background: 'var(--color-danger)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            <span style={{ color: 'var(--color-success)' }}>Wins: {summary.winCount}</span>
            <span style={{ color: 'var(--color-danger)' }}>Losses: {summary.lossCount}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Profit Factor',
      content: (
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.profitFactor.toFixed(2)}</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '0.75rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '4px solid rgba(148,163,184,0.3)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '6px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(34,197,94,0.3), transparent)',
                }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Wins ${Math.abs(summary.totalWinning).toFixed(0)} vs Losses ${Math.abs(summary.totalLosing).toFixed(0)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Average Risk Reward',
      content: (
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>1 : {summary.avgRiskReward.toFixed(2)}</div>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Avg R multiple per trade.</p>
        </div>
      ),
    },
    {
      title: 'Avg Win / Loss',
      content: (
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{ratio ? ratio.toFixed(2) : '0.00'}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--color-success)' }}>Win ${avgWinDisplay}</span>
            <span style={{ color: 'var(--color-danger)' }}>Loss ${avgLossDisplay}</span>
          </div>
          <div
            style={{
              height: '10px',
              marginTop: '0.35rem',
              borderRadius: '999px',
              background: 'rgba(148,163,184,0.2)',
              display: 'flex',
            }}
          >
            <span
              style={{
                width: `${summary.avgWin === 0 && summary.avgLoss === 0 ? 50 : Math.min(100, summary.avgWin)}%`,
                background: 'var(--color-success)',
                borderTopLeftRadius: '999px',
                borderBottomLeftRadius: '999px',
              }}
            />
            <span
              style={{
                width: `${summary.avgLoss === 0 && summary.avgWin === 0 ? 50 : Math.min(100, summary.avgLoss)}%`,
                background: 'var(--color-danger)',
                borderTopRightRadius: '999px',
                borderBottomRightRadius: '999px',
              }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="layout-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
      {cards.map((card) => (
        <div className="card" key={card.title}>
          <p className="card-title">{card.title}</p>
          {card.content}
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
