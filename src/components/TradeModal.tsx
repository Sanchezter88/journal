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

type TradeFormState = {
  date: string;
  time: string;
  contracts: number;
  side: TradeSide;
  instrument: string;
  result: TradeResult;
  riskRewardInput: string;
  pnlInput: string;
};

interface TradeModalProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<TradeFormValues>;
  onClose: () => void;
  onSubmit: (values: TradeFormValues) => Promise<void>;
}

const instrumentOptions = ['NQ', 'ES', 'MNQ', 'MES', 'CL', 'GC', 'Other'];

const TradeModal = ({ mode, initialValues, onClose, onSubmit }: TradeModalProps) => {
  const buildInitialState = (): TradeFormState => ({
    date: initialValues?.date ?? new Date().toISOString().slice(0, 10),
    time: initialValues?.time ?? '09:30',
    contracts: initialValues?.contracts ?? 1,
    side: (initialValues?.side as TradeSide) ?? 'LONG',
    instrument: initialValues?.instrument ?? 'NQ',
    result: (initialValues?.result as TradeResult) ?? 'WIN',
    riskRewardInput: initialValues?.riskRewardR !== undefined ? String(initialValues.riskRewardR) : '',
    pnlInput: initialValues?.pnl !== undefined ? String(Math.abs(initialValues.pnl)) : '',
  });

  const [form, setForm] = useState<TradeFormState>(buildInitialState);

  useEffect(() => {
    setForm(buildInitialState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, JSON.stringify(initialValues)]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (field: keyof TradeFormState, value: string) => {
    setForm((prev) => {
      if (field === 'contracts') {
        return { ...prev, contracts: Number(value) || 0 };
      }
      return { ...prev, [field]: value } as TradeFormState;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const trimmedRisk = form.riskRewardInput.trim();
    if (!trimmedRisk) {
      setError('Please enter a risk-reward multiple.');
      setSubmitting(false);
      return;
    }

    const riskValue = Number(trimmedRisk);
    if (!Number.isFinite(riskValue) || riskValue <= 0) {
      setError('Risk reward must be a positive number.');
      setSubmitting(false);
      return;
    }

    let pnlValue = 0;
    if (form.result !== 'BREAKEVEN') {
      const trimmedPnl = form.pnlInput.trim();
      if (!trimmedPnl) {
        setError('Please enter a profit or loss amount.');
        setSubmitting(false);
        return;
      }
      const parsedPnl = Number(trimmedPnl);
      if (!Number.isFinite(parsedPnl)) {
        setError('Profit / Loss must be a valid number.');
        setSubmitting(false);
        return;
      }
      pnlValue = Math.abs(parsedPnl);
      if (form.result === 'LOSS') {
        pnlValue = -pnlValue;
      }
    } else {
      pnlValue = 0;
    }

    if (form.result === 'WIN') {
      pnlValue = Math.abs(pnlValue);
    }

    const contractsValue = Number.isFinite(form.contracts) && form.contracts > 0 ? form.contracts : 1;

    const payload: TradeFormValues = {
      date: form.date,
      time: form.time,
      contracts: contractsValue,
      side: form.side,
      instrument: form.instrument,
      result: form.result,
      riskRewardR: riskValue,
      pnl: pnlValue,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save trade.');
    } finally {
      setSubmitting(false);
    }
  };

  const pnlColor =
    form.result === 'LOSS'
      ? 'var(--color-danger)'
      : form.result === 'WIN'
        ? 'var(--color-success)'
        : 'var(--color-muted)';

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
                onChange={(event) => handleFieldChange('date', event.target.value)}
                required
              />
            </label>
            <label className="label">
              Time
              <input
                type="time"
                className="input"
                value={form.time}
                onChange={(event) => handleFieldChange('time', event.target.value)}
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
                onChange={(event) => handleFieldChange('contracts', event.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="label">
              Side
              <select className="select" value={form.side} onChange={(event) => handleFieldChange('side', event.target.value)}>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </label>
            <label className="label">
              Instrument
              <select
                className="select"
                value={form.instrument}
                onChange={(event) => handleFieldChange('instrument', event.target.value)}
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
              <select className="select" value={form.result} onChange={(event) => handleFieldChange('result', event.target.value)}>
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
                placeholder="e.g. 2.5"
                value={form.riskRewardInput}
                onChange={(event) => handleFieldChange('riskRewardInput', event.target.value)}
              />
            </label>
            <label className="label">
              Profit / Loss ($)
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="e.g. 500"
                style={{ color: pnlColor }}
                value={form.pnlInput}
                onChange={(event) => handleFieldChange('pnlInput', event.target.value)}
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
