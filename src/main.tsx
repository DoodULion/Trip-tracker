import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { watchSystemTheme } from './theme';

// Offline support: the service worker caches the app after the first visit and
// updates itself in the background the next time the phone is online. (Production builds only.)
registerSW({ immediate: true });
watchSystemTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
