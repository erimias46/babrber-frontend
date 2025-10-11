// Service Worker for Background Location Tracking
const CACHE_NAME = 'barber-location-v1';
const LOCATION_CACHE_KEY = 'barber-location-cache';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Background sync for location updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'location-sync') {
    console.log('Background sync: updating location');
    event.waitUntil(updateLocationInBackground());
  }
});

// Handle background location updates
async function updateLocationInBackground() {
  try {
    // Get cached location data
    const cache = await caches.open(CACHE_NAME);
    const cachedLocation = await cache.get(LOCATION_CACHE_KEY);
    
    if (cachedLocation) {
      const locationData = await cachedLocation.json();
      
      // Send location update to server
      const response = await fetch('/api/barbers/location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${locationData.token}`
        },
        body: JSON.stringify({
          coordinates: locationData.coordinates,
          address: locationData.address
        })
      });
      
      if (response.ok) {
        console.log('Background location update successful');
      }
    }
  } catch (error) {
    console.error('Background location update failed:', error);
  }
}

// Handle push notifications for location updates
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'location-reminder') {
      const options = {
        body: 'Your location will be updated to keep you visible to customers.',
        icon: '/icons/barber-marker.svg',
        badge: '/icons/barber-marker.svg',
        tag: 'location-reminder',
        requireInteraction: true,
        actions: [
          {
            action: 'update-location',
            title: 'Update Location'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      };
      
      event.waitUntil(
        self.registration.showNotification('Location Update Reminder', options)
      );
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'update-location') {
    // Open the app and trigger location update
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          clients[0].postMessage({ type: 'UPDATE_LOCATION' });
          return clients[0].focus();
        } else {
          return self.clients.openWindow('/barber');
        }
      })
    );
  }
});

// Cache location data
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_LOCATION') {
    const { coordinates, address, token } = event.data;
    
    caches.open(CACHE_NAME).then(cache => {
      cache.put(LOCATION_CACHE_KEY, new Response(JSON.stringify({
        coordinates,
        address,
        token,
        timestamp: Date.now()
      })));
    });
  }
});
