
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global PWA Prompt Capture
// We attach this immediately at the top level to catch the event 
// if it fires before React is ready.
declare global {
  interface Window {
    elimusmart_deferredPrompt: any;
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  window.elimusmart_deferredPrompt = e;
  // Dispatch a custom event so the React app knows it's available
  window.dispatchEvent(new Event('elimusmart_pwa_installable'));
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';

    if (isHttps || isLocalhost) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('ElimuSmart PWA: Service Worker Active', reg.scope);
        })
        .catch(err => {
          console.debug('ElimuSmart PWA: SW Registration skipped', err.message);
        });
    }
  });
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
