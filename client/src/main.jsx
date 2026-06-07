import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const removeServiceWorkers = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const hadRegistrations = registrations.length > 0;

        await Promise.all(registrations.map((registration) => registration.unregister()));
        if (window.caches) {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((key) => window.caches.delete(key)));
        }

        return hadRegistrations;
      } catch (err) {
        console.error("Service worker cleanup failed:", err);
      }
      return false;
    };

    if (import.meta.env.DEV) {
      await removeServiceWorkers();
      return;
    }

    const removed = await removeServiceWorkers();
    if (removed && navigator.serviceWorker.controller) {
      window.location.reload();
    }
  });
}
