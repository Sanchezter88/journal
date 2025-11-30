import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onAddTrade: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onAddTrade }) => {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        gap: '1.5rem',
      }}
    >
      <div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>{title}</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '1rem' }}>{subtitle}</p>
      </div>
      <button className="btn btn-accent" style={{ padding: '0.85rem 2rem', borderRadius: '999px' }} onClick={onAddTrade}>
        + Add Trade
      </button>
    </div>
  );
};

export default Header;
