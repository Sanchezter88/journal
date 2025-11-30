import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './routes/Dashboard';
import TradeLog from './routes/TradeLog';
import DailyJournal from './routes/DailyJournal';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Trades', path: '/trades' },
  ];

  return (
    <div className="app-shell" style={{ flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(6px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.3rem' }}>Flowstate Journal</div>
            <div style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Your trading performance HQ</div>
          </div>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  color: location.pathname === item.path ? '#0f172a' : 'var(--color-muted)',
                  background: location.pathname === item.path ? 'var(--color-accent)' : 'transparent',
                  border: location.pathname === item.path ? 'none' : '1px solid transparent',
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="accent-chip">{currentUser?.email}</span>
          <button
            className="btn btn-muted"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
};

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-muted)' }}>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trades" element={<TradeLog />} />
        <Route path="/journal/:date" element={<DailyJournal />} />
      </Routes>
    </AppShell>
  );
}

export default App;
