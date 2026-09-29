import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n';
import './index.css';
import { getConsent, onConsentChange } from './lib/consent';

// Initialisation Sentry (Client)
if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.VITE_SENTRY_DSN.startsWith('http')) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
        delete event.request.cookies;
      }
      return event;
    },
  });

  // Replay est un traceur non essentiel : chargé uniquement après consentement,
  // avec masquage de tout le texte et des champs de saisie.
  let replayEnabled = false;
  const enableReplay = () => {
    if (replayEnabled) return;
    replayEnabled = true;
    Sentry.addIntegration(
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      })
    );
  };
  if (getConsent() === 'accepted') enableReplay();
  onConsentChange((value) => {
    if (value === 'accepted') enableReplay();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <App />
      </Router>
    </ErrorBoundary>
  </StrictMode>,
);
