import type { Trade } from '../data/models';
import { getSessionDate } from '../utils/tradingDay';

interface TradesTableProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  onViewDay?: (date: string) => void;
  showDate?: boolean;
}

const TradesTable = ({ trades, onEdit, onDelete, onViewDay, showDate = true }: TradesTableProps) => {
  return (
    <div className="card">
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              {showDate && <th>Date</th>}
              <th>Time</th>
              <th>Instrument</th>
              <th>Side</th>
              <th>Result</th>
              <th>Risk Reward</th>
              <th>P&L ($)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={showDate ? 8 : 7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-muted)' }}>
                  No trades yet.
                </td>
              </tr>
            ) : (
              trades.map((trade) => {
                const sessionDate = getSessionDate(trade.date, trade.time);
                return (
                  <tr key={trade.id} className="table-row">
                    {showDate && <td>{sessionDate}</td>}
                    <td>{trade.time}</td>
                    <td>
                      <span
                        className="accent-chip"
                        style={{ background: 'rgba(56,189,248,0.12)', display: 'inline-flex', gap: '0.35rem' }}
                      >
                        <span>{trade.instrument}</span>
                        <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>{`${trade.contracts ?? 1}x`}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${trade.side === 'LONG' ? 'badge-long' : 'badge-short'}`}>{trade.side}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          trade.result === 'WIN' ? 'badge-win' : trade.result === 'LOSS' ? 'badge-loss' : 'badge-breakeven'
                        }`}
                      >
                        {trade.result}
                      </span>
                    </td>
                    <td>1 : {Number.isFinite(trade.riskRewardR) ? trade.riskRewardR.toFixed(2) : '0.00'}</td>
                    <td style={{ color: trade.pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {trade.pnl >= 0 ? '+' : '-'}${Math.abs(trade.pnl).toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-muted" onClick={() => onEdit(trade)}>
                          Edit
                        </button>
                        {onDelete ? (
                          <button className="btn btn-ghost" onClick={() => onDelete(trade)}>
                            Delete
                          </button>
                        ) : null}
                        {onViewDay ? (
                          <button className="btn btn-ghost" onClick={() => onViewDay(sessionDate)}>
                            View Day
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradesTable;
