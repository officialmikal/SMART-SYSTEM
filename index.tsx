
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
    // Construct path relative to current URL to prevent origin mismatch errors in preview environments
    const swPath = new URL('./sw.js', window.location.href).href;
    
    navigator.serviceWorker.register(swPath)
      .then(reg => console.log('ElimuSmart PWA: Service Worker Active', reg.scope))
      .catch(err => {
        // Silently fail in restricted sandbox environments to prevent console clutter
        if (err.name !== 'SecurityError') {
           console.log('ElimuSmart PWA: SW Registration Failed', err);
        }
      });
  });
}

const root = ReactDOMClient.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
