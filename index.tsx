
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
    // Relative path used to ensure registration works in root environments
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => console.log('ElimuSmart SW Registered', reg.scope))
      .catch(err => console.log('ElimuSmart SW Registration Failed', err));
  });
}

const root = ReactDOMClient.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);