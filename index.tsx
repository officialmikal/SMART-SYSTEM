import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

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