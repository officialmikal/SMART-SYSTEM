import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Only attempt registration in secure contexts (HTTPS or Localhost)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';

    if (isHttps || isLocalhost) {
      // Use direct relative path to avoid "Invalid URL" construction errors
      // and ensure registration stays within the same origin scope
      navigator.serviceWorker.register('sw.js')
        .then(reg => {
          console.log('ElimuSmart PWA: Service Worker Active', reg.scope);
        })
        .catch(err => {
          // Failure to register a SW should not crash the main app
          console.debug('ElimuSmart PWA: SW Registration skipped', err.message);
        });
    }
  });
}

const root = ReactDOMClient.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);