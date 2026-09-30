import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { i18nReady } from './i18n';
import './index.css';
import { getConsent, onConsentChange } from './lib/consent';
import { initAnalytics } from './lib/analytics';

// Initialisation Sentry (client), chargé à part pour ne pas alourdir le premier
// affichage : les erreurs survenues avant son chargement ne sont pas remontées.
const initSentry = async () => {
  const Sentry = await import('@sentry/react');
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
};

if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.VITE_SENTRY_DSN.startsWith('http')) {
  initSentry().catch(() => { /* suivi d'erreurs indisponible */ });
}

initAnalytics();

const render = () => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <App />
      </Router>
    </ErrorBoundary>
  </StrictMode>,
);

// Rendu une fois la langue chargée ; en cas d'échec du chargement, l'interface
// s'affiche quand même (en français, langue de repli).
i18nReady.then(render, render);
