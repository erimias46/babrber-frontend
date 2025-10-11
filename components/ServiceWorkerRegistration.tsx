"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker for background sync and keep-alive
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration.scope);
          
          // Set up periodic keep-alive ping to maintain connection
          setInterval(() => {
            if (registration.active) {
              const channel = new MessageChannel();
              channel.port1.onmessage = (event) => {
                if (event.data.type === 'PONG') {
                  console.log('🏓 Service Worker keep-alive pong received');
                }
              };
              
              registration.active.postMessage(
                { type: 'KEEP_ALIVE' },
                [channel.port2]
              );
            }
          }, 30000); // Ping every 30 seconds
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_LOCATION') {
          console.log('📍 Service Worker requesting location update');
          // Trigger location update event
          window.dispatchEvent(new CustomEvent('sw-location-update'));
        }
      });
    } else {
      console.warn('⚠️ Service Worker not supported in this browser');
    }
  }, []);

  return null; // This component doesn't render anything
}

