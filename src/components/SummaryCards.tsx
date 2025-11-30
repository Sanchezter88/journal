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
  const ratio = summary.avgLoss === 0 ? null : summary.avgWin / summary.avgLoss;
  const totalMove = Math.abs(summary.totalWinning) + Math.abs(summary.totalLosing);
  const winDollarWidth = totalMove ? (Math.abs(summary.totalWinning) / totalMove) * 100 : 50;
  const lossDollarWidth = totalMove ? (Math.abs(summary.totalLosing) / totalMove) * 100 : 50;
  const profitFactorDisplay = summary.lossCount === 0 ? '∞' : summary.profitFactor.toFixed(2);

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
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{profitFactorDisplay}</div>
          <div className="summary-bar">
            <span style={{ width: `${winDollarWidth}%`, background: 'var(--color-success)' }} />
            <span style={{ width: `${lossDollarWidth}%`, background: 'var(--color-danger)' }} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.35rem' }}>
            Wins ${Math.abs(summary.totalWinning).toFixed(0)} vs Losses ${Math.abs(summary.totalLosing).toFixed(0)}
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
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{ratio === null ? '∞' : ratio.toFixed(2)}</div>
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
