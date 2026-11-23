import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './app/zodSetup';
import { App } from './app/App';
import { BootGate } from './app/BootGate';
import { registerServiceWorker } from './pwa/register';
import { applyTheme, useThemeStore } from './theme/themeStore';

// Keep the DOM in sync with the stored preference (index.html already applied it pre-paint).
applyTheme(useThemeStore.getState().preference);

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <BootGate>
      <App />
    </BootGate>
  </StrictMode>,
);

// Production only: a service worker in dev mode would cache stale modules.
if (import.meta.env.PROD) registerServiceWorker();
