# PWA and Offline Support Specification

## Overview

This specification defines the requirements for the Progressive Web App (PWA) functionality, including service worker registration, offline support, and installability. This allows users to use the application offline and install it as a native app on supported devices.

## Requirements

### Service Worker Registration

- The system MUST register a service worker on application initialization
- The system MUST check for Service Worker API support before registration
- The system MUST log successful registration to the console
- The system MUST log registration failures to the console
- The system MUST handle registration errors gracefully
- The system MAY display a message if service worker registration fails

### Service Worker Scope

- The service worker MUST control the entire application
- The service worker MUST have the correct scope for the application root
- The service worker MUST be able to intercept all network requests
- The service worker MUST handle navigation requests

### Offline Caching

- The service worker MUST implement a cache-first strategy for static assets
- The service worker MUST cache the following assets:
  - index.html
  - styles.css
  - script.js
  - sw.js
  - manifest.json
- The service worker MUST use a specific cache version (e.g., 'journey-v1')
- The service worker MUST update the cache version when assets change
- The service worker MUST delete old caches during activation
- The service worker MUST serve cached assets when offline
- The service worker MUST attempt to fetch from network when online
- The service worker MUST update the cache when new versions are available

### Cache Management

- The service worker MUST respond to the 'install' event
- The service worker MUST pre-cache critical assets during installation
- The service worker MUST respond to the 'activate' event
- The service worker MUST clean up old caches during activation
- The service worker MUST skip waiting to activate immediately
- The service worker MUST claim all clients immediately

### Network Strategy

The service worker MUST implement the following strategy:
1. For static assets (HTML, CSS, JS): Cache-first, fall back to network
2. For other requests: Network-only (pass through)

### Manifest Requirements

The application MUST provide a Web App Manifest (manifest.json) with:
- `name`: The full application name
- `short_name`: A short name for the app (≤12 characters recommended)
- `start_url`: The URL to launch when opening the app (should be `./`)
- `display`: Display mode (should be `standalone` or `minimal-ui`)
- `background_color`: The background color for the splash screen
- `theme_color`: The theme color for the browser UI
- `icons`: At least two icon sizes:
  - A 192x192 pixel icon (required for installability)
  - A 512x512 pixel icon (required for splash screen)
- `orientation`: Preferred orientation (should be `any` or `natural`)

### Installability Criteria

The application MUST meet all criteria to be installable:
- MUST be served over HTTPS (or localhost for development)
- MUST have a valid Web App Manifest
- MUST have a registered service worker
- MUST have at least one icon (minimum 192x192)
- MUST have a start_url that loads successfully
- MUST NOT be already installed

### Install Prompt

- The system MUST allow the browser to show an install prompt
- The system MUST NOT prevent the default install prompt
- The system MAY customize the install experience
- The system MUST handle app installation if the user accepts

### Offline Functionality

- The application MUST be fully functional when offline
- The application MUST load from cache when offline
- The application MUST allow viewing existing entries when offline
- The application MUST allow creating new entries when offline
- The application MUST allow editing entries when offline
- The application MUST sync changes when back online (for features that support it)
- The application MUST display an offline indicator if applicable

## Service Worker Implementation

### Installation Event

```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});
```

### Activation Event

```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_VERSION)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});
```

### Fetch Event

```javascript
self.addEventListener('fetch', (event) => {
  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## User Interface Requirements

### Install UI

- The application MUST NOT prevent the browser's native install prompt
- The application MAY add a custom install button
- A custom install button MUST be hidden if the app is already installed
- A custom install button MUST be hidden if the browser doesn't support install

### Offline Indicator

- The application MAY display an indicator when offline
- The offline indicator MUST be subtle and non-intrusive
- The offline indicator MUST be clearly visible when present

## Browser Compatibility

- The system MUST work in Chrome/Edge (full PWA support)
- The system MUST work in Firefox (partial PWA support)
- The system SHOULD work in Safari (limited PWA support on iOS)
- The system MUST gracefully degrade features in unsupported browsers

## Performance Requirements

- The service worker MUST install within 5 seconds on 3G
- The service worker MUST serve cached assets within 100ms
- The application MUST be interactive within 3 seconds on 3G
- The initial download MUST be under 1MB (uncached)

## Security Requirements

- The application MUST be served over HTTPS in production
- The service worker MUST only work on secure contexts (HTTPS or localhost)
- The service worker MUST not expose sensitive data in the cache
- The manifest MUST not contain insecure HTTP URLs

## Testing Requirements

- The service worker MUST be tested in offline mode
- The application MUST be tested on actual mobile devices
- The install prompt MUST be tested across different browsers
- Cache updates MUST be tested when deploying new versions

## Error Handling

### Service Worker Errors

- Registration failures MUST be logged but not crash the app
- Cache failures MUST fall back to network
- Missing cached assets MUST attempt network fetch
- Service worker update failures MUST not break the app

### Cache Errors

- Cache quota exceeded MUST be handled gracefully
- Corrupted cache MUST be cleared and rebuilt
- Cache version mismatches MUST trigger a cache update

## Accessibility Requirements

- The installed app MUST be fully accessible via screen readers
- The app MUST respect the user's color scheme preferences
- The app MUST respect the user's reduced motion preferences
- The app MUST work with the user's font size preferences
