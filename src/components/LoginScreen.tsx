import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

const LoginScreen = () => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div className="card" style={{ width: 'min(480px, 100%)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Trading Journal</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
          Track, review, and optimize your trading performance.
        </p>
        <form onSubmit={handleSubmit} className="layout-grid" style={{ gap: '1rem' }}>
          <label className="label">
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter any password"
              required
            />
          </label>
          {error ? (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</div>
          ) : null}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-accent" type="submit" disabled={submitting}>
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
            <button
              type="button"
              className="btn btn-muted"
              disabled={submitting}
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
