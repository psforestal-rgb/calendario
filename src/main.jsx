import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Service Worker registration with auto-update and periodic check
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      console.log('SW registrado:', reg.scope);

      // Check for updates immediately
      reg.update();

      // Check for updates every 60 seconds
      setInterval(() => {
        reg.update().catch(() => {});
      }, 60 * 1000);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version installed and waiting — show update banner
            showUpdateBanner(newWorker);
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

function showUpdateBanner(worker) {
  // Don't show duplicates
  if (document.getElementById('sw-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #1a73e8; color: white; padding: 12px 20px; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 99999;
    display: flex; align-items: center; gap: 12px; font-family: sans-serif;
    font-size: 14px; animation: slideUp 0.3s ease-out;
  `;
  banner.innerHTML = `
    <span>Nueva versión disponible</span>
    <button id="sw-update-btn" style="
      background: white; color: #1a73e8; border: none; padding: 6px 16px;
      border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;
    ">Actualizar</button>
    <button id="sw-dismiss-btn" style="
      background: transparent; color: rgba(255,255,255,0.8); border: none;
      cursor: pointer; font-size: 18px; padding: 0 4px; line-height: 1;
    ">&times;</button>
  `;

  // Add slide-up animation
  const style = document.createElement('style');
  style.textContent = `@keyframes slideUp { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`;
  document.head.appendChild(style);

  document.body.appendChild(banner);

  document.getElementById('sw-update-btn').addEventListener('click', () => {
    worker.postMessage('SKIP_WAITING');
    banner.remove();
  });

  document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
    banner.remove();
  });
}
