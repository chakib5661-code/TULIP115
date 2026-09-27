import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initAnalytics } from './utils/analytics.ts';
import { initPwaVersionManager } from './utils/pwaVersionManager.ts';
import './index.css';

// Initialize PWA auto-update & chunk-error self-healing immediately before any components load
initPwaVersionManager();

// Initialize Analytics & Tracking Scripts (Google Analytics 4 & Microsoft Clarity from Environment Variables)
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
