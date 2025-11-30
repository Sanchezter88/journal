import { useEffect, useState } from 'react';
import type { Strategy, StrategyItem } from '../data/models';
import {
  createOrUpdateStrategy,
  deleteStrategy,
  getStrategies,
  getStrategyItems,
} from '../data/repositories/strategyRepository';
import type { StrategyUpsertInput } from '../data/repositories/strategyRepository';
import { getChecklistStates, setChecklistState } from '../data/repositories/strategyChecklistRepository';

interface StrategyChecklistProps {
  userId: string;
  date: string;
}

const StrategyChecklist = ({ userId, date }: StrategyChecklistProps) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [items, setItems] = useState<StrategyItem[]>([]);
  const [stateMap, setStateMap] = useState<Record<string, boolean>>({});
  const [builderMode, setBuilderMode] = useState<'create' | 'edit'>('create');
  const [builderName, setBuilderName] = useState('');
  const [builderItems, setBuilderItems] = useState<{ id?: string; text: string }[]>([]);
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);

  const loadStrategies = async () => {
    const list = await getStrategies(userId);
    setStrategies(list);
    if (list.length === 0) {
      setSelectedStrategyId(null);
      return;
    }
    if (!selectedStrategyId) {
      setSelectedStrategyId(list[0].id);
      return;
    }
    const exists = list.some((strategy) => strategy.id === selectedStrategyId);
    if (!exists) {
      setSelectedStrategyId(list[0].id);
    }
  };

  const loadItems = async (strategyId: string) => {
    const result = await getStrategyItems(userId, strategyId);
    setItems(result);
  };

  const loadChecklist = async () => {
    const states = await getChecklistStates(userId, date);
    const map: Record<string, boolean> = {};
    states.forEach((state) => {
      map[state.itemId] = state.checked;
    });
    setStateMap(map);
  };

  useEffect(() => {
    loadStrategies();
  }, [userId]);

  useEffect(() => {
    if (selectedStrategyId) {
      loadItems(selectedStrategyId);
    } else {
      setItems([]);
    }
  }, [selectedStrategyId]);

  useEffect(() => {
    loadChecklist();
  }, [userId, date]);

  const handleToggle = async (itemId: string, checked: boolean) => {
    if (!selectedStrategyId) return;
    setStateMap((prev) => ({ ...prev, [itemId]: checked }));
    await setChecklistState(userId, date, selectedStrategyId, itemId, checked);
  };

  const beginCreate = () => {
    setBuilderMode('create');
    setBuilderName('');
    setBuilderItems([]);
    setEditingStrategyId(null);
  };

  const beginEdit = () => {
    if (!selectedStrategyId) return;
    const strategy = strategies.find((s) => s.id === selectedStrategyId);
    if (!strategy) return;
    setBuilderMode('edit');
    setBuilderName(strategy.name);
    setEditingStrategyId(strategy.id);
    setBuilderItems(items.map((item) => ({ id: item.id, text: item.text })));
  };

  const handleSaveStrategy = async () => {
    if (!builderName || builderItems.length === 0) return;
    const payload: StrategyUpsertInput = {
      id: builderMode === 'edit' ? editingStrategyId ?? undefined : undefined,
      name: builderName,
      items: builderItems.map((item, index) => ({ id: item.id, text: item.text, orderIndex: index })),
    };
    const { strategy } = await createOrUpdateStrategy(userId, payload);
    await loadStrategies();
    setSelectedStrategyId(strategy.id);
    setBuilderName('');
    setBuilderItems([]);
    setBuilderMode('create');
    setEditingStrategyId(null);
  };

  const handleDeleteStrategy = async () => {
    if (!selectedStrategyId) return;
    await deleteStrategy(userId, selectedStrategyId);
    await loadStrategies();
    setItems([]);
  };

  const builderTitle = builderMode === 'create' ? 'Create Strategy' : 'Edit Strategy';

  return (
    <div
      className="layout-grid"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: '1.5rem', gap: '1.5rem' }}
    >
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <p className="card-title">Strategy Checklist</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-muted" onClick={beginCreate}>
              New Strategy
            </button>
            <button className="btn btn-ghost" onClick={beginEdit} disabled={!selectedStrategyId}>
              Edit Strategy
            </button>
          </div>
        </div>
        {strategies.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>Create a strategy to begin tracking.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <select
              className="select"
              value={selectedStrategyId ?? ''}
              onChange={(event) => setSelectedStrategyId(event.target.value)}
            >
              <option value="" disabled>
                Select strategy
              </option>
              {strategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </select>
            {items.length === 0 ? (
              <p style={{ color: 'var(--color-muted)' }}>No checklist items.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {items.map((item) => (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: 'rgba(148,163,184,0.08)',
                      padding: '0.75rem',
                      borderRadius: '12px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(stateMap[item.id])}
                      onChange={(event) => handleToggle(item.id, event.target.checked)}
                    />
                    <span>{item.text}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedStrategyId ? (
              <button className="btn btn-ghost" onClick={handleDeleteStrategy}>
                Delete Strategy
              </button>
            ) : null}
          </div>
        )}
      </div>
      <div className="card">
        <p className="card-title">{builderTitle}</p>
        <div className="layout-grid" style={{ gap: '0.75rem' }}>
          <label className="label">
            Strategy Name
            <input
              className="input"
              value={builderName}
              onChange={(event) => setBuilderName(event.target.value)}
              placeholder="Opening Drive"
            />
          </label>
          <div>
            <p style={{ marginBottom: '0.5rem', color: 'var(--color-muted)', fontSize: '0.9rem' }}>Checklist Items</p>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {builderItems.map((item, index) => (
                <div key={item.id ?? index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    className="input"
                    value={item.text}
                    onChange={(event) =>
                      setBuilderItems((prev) => prev.map((it, idx) => (idx === index ? { ...it, text: event.target.value } : it)))
                    }
                    placeholder={`Condition ${index + 1}`}
                  />
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        setBuilderItems((prev) => {
                          if (index === 0) return prev;
                          const copy = [...prev];
                          [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
                          return copy;
                        })
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        setBuilderItems((prev) => {
                          if (index === prev.length - 1) return prev;
                          const copy = [...prev];
                          [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]];
                          return copy;
                        })
                      }
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setBuilderItems((prev) => prev.filter((_, idx) => idx !== index))}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn btn-muted" type="button" onClick={() => setBuilderItems((prev) => [...prev, { text: '' }])}>
                Add Condition
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-ghost" type="button" onClick={beginCreate}>
              Cancel
            </button>
            <button className="btn btn-accent" type="button" onClick={handleSaveStrategy} disabled={!builderName || builderItems.length === 0}>
              Save Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyChecklist;
