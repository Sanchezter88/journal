import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

interface JournalNotesProps {
  initialNotes: string;
  onSave: (notes: string) => Promise<void>;
}

const JournalNotes = ({ initialNotes, onSave }: JournalNotesProps) => {
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    await onSave(notes);
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <p className="card-title">Journal Notes</p>
        <button className="btn btn-accent" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save Notes'}
        </button>
      </div>
      <textarea
        className="textarea"
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          if (status === 'saved') setStatus('idle');
        }}
        placeholder="What did you learn today?"
      />
      {status === 'saved' ? (
        <div style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Saved</div>
      ) : null}
    </form>
  );
};

export default JournalNotes;
