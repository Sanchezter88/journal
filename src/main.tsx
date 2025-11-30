import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthContext';
import { FiltersProvider } from './data/filters/filtersContext';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FiltersProvider>
          <App />
        </FiltersProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
