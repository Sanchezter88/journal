import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './routes/Dashboard';
import TradeLog from './routes/TradeLog';
import DailyJournal from './routes/DailyJournal';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const {
    currentUser,
    currentAccount,
    accounts,
    logout,
    selectAccount,
    addAccount,
    renameAccount,
    deleteAccount,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountEditorOpen, setAccountEditorOpen] = useState(false);
  const [accountEditorTargetId, setAccountEditorTargetId] = useState<string | null>(null);
  const [accountNameInput, setAccountNameInput] = useState('');
  const [deleteStepActive, setDeleteStepActive] = useState(false);
  const [deleteEmailValue, setDeleteEmailValue] = useState('');
  const [accountActionError, setAccountActionError] = useState('');
  const editorAccount = accounts.find((account) => account.id === accountEditorTargetId) ?? null;

  useEffect(() => {
    if (editorAccount) {
      setAccountNameInput(editorAccount.name);
    }
  }, [editorAccount]);

  const closeAccountEditor = () => {
    setAccountEditorOpen(false);
    setAccountEditorTargetId(null);
    setAccountNameInput('');
    setDeleteStepActive(false);
    setDeleteEmailValue('');
    setAccountActionError('');
  };

  useEffect(() => {
    if (accountEditorOpen && !editorAccount) {
      closeAccountEditor();
    }
  }, [accountEditorOpen, editorAccount]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <span className="accent-chip">{currentUser?.email}</span>
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-accent"
              style={{
                minWidth: '140px',
                background: 'var(--color-accent)',
                color: '#0f172a',
                borderRadius: '999px',
                padding: '0.4rem 0.9rem',
                fontWeight: 600,
              }}
              disabled={!currentAccount}
              onClick={() => setAccountMenuOpen((prev) => !prev)}
            >
              {currentAccount ? currentAccount.name : 'Loading...'}
            </button>
            {accountMenuOpen ? (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 0.5rem)',
                  width: '240px',
                  zIndex: 30,
                  boxShadow: '0 10px 30px rgba(15,23,42,0.7)',
                }}
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <p className="card-title" style={{ marginBottom: '0.25rem' }}>
                    Accounts
                  </p>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                    Switch between live and backtesting books.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {accounts.length === 0 ? (
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>No accounts yet.</p>
                  ) : (
                    accounts.map((account) => {
                      const isActive = account.id === currentAccount?.id;
                      return (
                        <button
                          key={account.id}
                          className="btn btn-ghost"
                          style={{
                            justifyContent: 'flex-start',
                            background: isActive ? 'var(--color-accent)' : 'rgba(148,163,184,0.12)',
                            color: isActive ? '#0f172a' : 'var(--color-text)',
                            fontWeight: isActive ? 700 : 500,
                          }}
                          onClick={() => {
                            selectAccount(account.id);
                            setAccountMenuOpen(false);
                          }}
                        >
                          {account.name}
                        </button>
                      );
                    })
                  )}
                </div>
                <button
                  className="btn btn-muted"
                  style={{ width: '100%' }}
                  onClick={async () => {
                    const name = window.prompt('Account name');
                    if (!name) return;
                    await addAccount(name);
                    setAccountMenuOpen(false);
                  }}
                >
                  + Add Account
                </button>
              </div>
            ) : null}
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (!currentAccount) return;
              setAccountNameInput(currentAccount.name);
              setAccountEditorTargetId(currentAccount.id);
              setDeleteStepActive(false);
              setDeleteEmailValue('');
              setAccountActionError('');
              setAccountEditorOpen(true);
              setAccountMenuOpen(false);
            }}
            disabled={!currentAccount}
            aria-label="Edit account"
          >
            ✎
          </button>
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
      {accountEditorOpen && editorAccount ? (
        <div className="modal-overlay" onClick={closeAccountEditor}>
          <div className="modal-container" style={{ maxWidth: '400px' }} onClick={(event) => event.stopPropagation()}>
            <h3 style={{ marginBottom: '0.5rem' }}>Edit account</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              Rename or remove the selected account.
            </p>
            <label className="label" style={{ marginBottom: '0.75rem' }}>
              Account name
              <input
                className="input"
                value={accountNameInput}
                onChange={(event) => {
                  setAccountNameInput(event.target.value);
                  if (accountActionError) setAccountActionError('');
                }}
                placeholder="Enter account name"
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-muted" type="button" onClick={closeAccountEditor}>
                Cancel
              </button>
              <button
                className="btn btn-accent"
                type="button"
                onClick={async () => {
                  if (!editorAccount) return;
                  const trimmed = accountNameInput.trim();
                  if (!trimmed) {
                    setAccountActionError('Name is required.');
                    return;
                  }
                  await renameAccount(editorAccount.id, trimmed);
                  closeAccountEditor();
                }}
              >
                Save Name
              </button>
            </div>
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(148,163,184,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <p style={{ fontWeight: 600 }}>Delete account</p>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                This removes all trades, notes, and strategies for this account.
              </p>
              {!deleteStepActive ? (
                <button
                  className="btn btn-ghost"
                  style={{ color: 'var(--color-danger, #ef4444)' }}
                  disabled={accounts.length <= 1}
                  onClick={() => {
                    setDeleteStepActive(true);
                    setAccountActionError('');
                  }}
                >
                  Begin Delete
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="label">
                    Confirm email
                    <input
                      className="input"
                      placeholder={currentUser?.email}
                      value={deleteEmailValue}
                      onChange={(event) => {
                        setDeleteEmailValue(event.target.value);
                        if (accountActionError) setAccountActionError('');
                      }}
                    />
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <button
                      className="btn btn-muted"
                      type="button"
                      onClick={() => {
                        setDeleteStepActive(false);
                        setDeleteEmailValue('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn"
                      style={{ background: 'var(--color-danger, #ef4444)', color: '#fff' }}
                      type="button"
                      onClick={async () => {
                        if (!editorAccount) return;
                        if (deleteEmailValue.trim().toLowerCase() !== (currentUser?.email ?? '').toLowerCase()) {
                          setAccountActionError('Email must match your login email.');
                          return;
                        }
                        try {
                          await deleteAccount(editorAccount.id);
                          closeAccountEditor();
                        } catch (error) {
                          setAccountActionError(error instanceof Error ? error.message : 'Unable to delete account.');
                        }
                      }}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
              {accountActionError ? (
                <p style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.85rem' }}>{accountActionError}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
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
