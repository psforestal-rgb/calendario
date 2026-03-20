import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Service Worker registration with auto-update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      console.log('SW registrado:', reg.scope);
      reg.update();
      // Check for SW updates every 60 seconds (helps installed PWAs pick up changes)
      setInterval(() => reg.update(), 60 * 1000);
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
            console.log('Nueva versión detectada, recargando...');
            window.location.reload();
          }
        });
      });
    }).catch(err => console.warn('SW error:', err));
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}
