
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
    // Simple relative path is the most robust way to register a service worker
    // across different hosting environments and prevents "Invalid URL" errors.
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('ElimuSmart PWA: Service Worker Active', reg.scope))
      .catch(err => {
        // Log as debug to avoid cluttering production consoles while allowing diagnosis
        console.debug('ElimuSmart PWA: SW Registration skipped', err);
      });
  });
}

const root = ReactDOMClient.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
