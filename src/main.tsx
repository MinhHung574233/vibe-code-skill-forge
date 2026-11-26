import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './app/zodSetup';
import { App } from './app/App';
import { BootGate } from './app/BootGate';
import { getLanguage, loadDictionary } from './i18n/core';
import { LanguageBoundary } from './i18n/react';
import { registerServiceWorker } from './pwa/register';
import { applyTheme, useThemeStore } from './theme/themeStore';

// Keep the DOM in sync with the stored preference (index.html already applied it pre-paint).
applyTheme(useThemeStore.getState().preference);

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

const render = () =>
  createRoot(container).render(
    <StrictMode>
      <BootGate>
        <LanguageBoundary>
          <App />
        </LanguageBoundary>
      </BootGate>
    </StrictMode>,
  );

// English users never download the Vietnamese dictionary; Vietnamese users get it before first paint.
if (getLanguage() === 'vi') void loadDictionary().then(render, render);
else render();

// Production only: a service worker in dev mode would cache stale modules.
if (import.meta.env.PROD) registerServiceWorker();
