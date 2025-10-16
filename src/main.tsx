import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './App.css';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Try the main service worker first, fallback to minimal if it fails
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed, trying minimal version: ', registrationError);
        // Fallback to minimal service worker
        navigator.serviceWorker.register('/service-worker-minimal.js')
          .then((registration) => {
            console.log('Minimal SW registered: ', registration);
          })
          .catch((minimalError) => {
            console.log('Minimal SW registration also failed: ', minimalError);
          });
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
