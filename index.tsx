
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global PWA Prompt Capture
declare global {
  interface Window {
    elimusmart_deferredPrompt: any;
  }
}

console.log('ElimuSmart PWA: Entry point initialized.');

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('ElimuSmart PWA: beforeinstallprompt event captured!');
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  window.elimusmart_deferredPrompt = e;
  // Dispatch a custom event so the React app knows it's available
  window.dispatchEvent(new Event('elimusmart_pwa_installable'));
});

window.addEventListener('appinstalled', () => {
  console.log('ElimuSmart PWA: App successfully installed!');
  window.elimusmart_deferredPrompt = null;
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
          console.log('ElimuSmart PWA: Service Worker registered successfully with scope:', reg.scope);
        })
        .catch(err => {
          console.error('ElimuSmart PWA: Service Worker registration failed:', err.message);
        });
    } else {
      console.warn('ElimuSmart PWA: Service Worker skipped (Not HTTPS or Localhost)');
    }
  });
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
