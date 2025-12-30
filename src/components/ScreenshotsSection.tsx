import { useRef, useState } from 'react';
import type { Screenshot } from '../data/models';

interface ScreenshotsSectionProps {
  screenshots: Screenshot[];
  onUpload: (files: FileList) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ScreenshotsSection = ({ screenshots, onUpload, onDelete }: ScreenshotsSectionProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<Screenshot | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    await onUpload(files);
    setUploading(false);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <p className="card-title">Screenshots</p>
        <button className="btn btn-muted" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Attach'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
      {screenshots.length === 0 ? (
        <p style={{ color: 'var(--color-muted)' }}>No screenshots yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {screenshots.map((shot) => (
            <div
              key={shot.id}
              style={{ borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(148,163,184,0.2)' }}
            >
              <img
                src={shot.fileUrl}
                alt={shot.description ?? 'Screenshot'}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '320px',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  display: 'block',
                  background: 'rgba(15,23,42,0.35)'
                }}
                onClick={() => setPreview(shot)}
              />
              <button
                className="btn btn-ghost"
                style={{ position: 'absolute', top: '4px', right: '4px', padding: '0.2rem 0.45rem' }}
                onClick={() => onDelete(shot.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {preview ? (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-container" style={{ maxWidth: '720px' }} onClick={(event) => event.stopPropagation()}>
            <img src={preview.fileUrl} alt={preview.description ?? 'Screenshot detail'} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ScreenshotsSection;
