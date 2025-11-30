import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { TradeResult, TradeSide } from '../data/models';

export interface TradeFormValues {
  date: string;
  time: string;
  contracts: number;
  side: TradeSide;
  instrument: string;
  result: TradeResult;
  riskRewardR: number;
  pnl: number;
}

interface TradeModalProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<TradeFormValues>;
  onClose: () => void;
  onSubmit: (values: TradeFormValues) => Promise<void>;
}

const instrumentOptions = ['NQ', 'ES', 'MNQ', 'MES', 'CL', 'GC', 'Other'];

const TradeModal = ({ mode, initialValues, onClose, onSubmit }: TradeModalProps) => {
  const buildInitialState = () => ({
    date: initialValues?.date ?? new Date().toISOString().slice(0, 10),
    time: initialValues?.time ?? '09:30',
    contracts: initialValues?.contracts ?? 1,
    side: (initialValues?.side as TradeSide) ?? 'LONG',
    instrument: initialValues?.instrument ?? 'NQ',
    result: (initialValues?.result as TradeResult) ?? 'WIN',
    riskRewardR: initialValues?.riskRewardR ?? 1,
    pnl: initialValues?.pnl ?? 0,
  });

  const [form, setForm] = useState<TradeFormValues>(buildInitialState);

  useEffect(() => {
    setForm(buildInitialState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, JSON.stringify(initialValues)]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof TradeFormValues, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === 'contracts'
          ? Number(value)
          : field === 'riskRewardR' || field === 'pnl'
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save trade.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>{mode === 'create' ? 'Add New Trade' : 'Edit Trade'}</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Log every execution with precise details.</p>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <form className="layout-grid" style={{ gap: '1rem' }} onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="label">
              Date
              <input
                type="date"
                className="input"
                max={new Date().toISOString().slice(0, 10)}
                value={form.date}
                onChange={(event) => handleChange('date', event.target.value)}
                required
              />
            </label>
            <label className="label">
              Time
              <input
                type="time"
                className="input"
                value={form.time}
                onChange={(event) => handleChange('time', event.target.value)}
                required
              />
            </label>
            <label className="label">
              Contracts
              <input
                type="number"
                min={1}
                className="input"
                value={form.contracts}
                onChange={(event) => handleChange('contracts', event.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="label">
              Side
              <select className="select" value={form.side} onChange={(event) => handleChange('side', event.target.value)}>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </label>
            <label className="label">
              Instrument
              <select
                className="select"
                value={form.instrument}
                onChange={(event) => handleChange('instrument', event.target.value)}
              >
                {instrumentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              Result
              <select className="select" value={form.result} onChange={(event) => handleChange('result', event.target.value)}>
                <option value="WIN">Win</option>
                <option value="LOSS">Loss</option>
                <option value="BREAKEVEN">Break-even</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="label">
              Risk Reward (1:R)
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.riskRewardR}
                onChange={(event) => handleChange('riskRewardR', event.target.value)}
              />
            </label>
            <label className="label">
              Profit / Loss ($)
              <input
                type="number"
                step="0.01"
                className="input"
                style={{ color: form.pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
                value={form.pnl}
                onChange={(event) => handleChange('pnl', event.target.value)}
              />
            </label>
          </div>
          {error ? <div style={{ color: 'var(--color-danger)' }}>{error}</div> : null}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-muted" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={submitting}>
              {mode === 'create' ? 'Add Trade' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeModal;
