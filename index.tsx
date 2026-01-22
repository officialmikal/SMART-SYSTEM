
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
    // Registering without explicit scope to allow default root scope
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('ElimuSmart PWA: Service Worker Active', reg.scope))
      .catch(err => console.log('ElimuSmart PWA: SW Registration Failed', err));
  });
}

const root = ReactDOMClient.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
