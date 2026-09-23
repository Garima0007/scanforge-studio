'use strict';

const CACHE_NAME = 'qrforge-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './css/main.css',
  './css/components.css',
  './css/animations.css',
  './js/templates.js',
  './js/presets.js',
  './js/crypto.js',
  './js/qr-engine.js',
  './js/scanner.js',
  './js/bulk.js',
  './js/app.js',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }))
  );
});
