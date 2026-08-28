/* eslint-disable */
// Firebase Cloud Messaging service worker.
//
// Served as a static file from `public/` (Vite copies it to the site root as-is — it is NOT
// bundled/transpiled, so no TypeScript, no `import.meta.env`, and no ES module imports here).
// Service workers can't read Vite env vars, so the Firebase config below is hardcoded to match
// `src/lib/firebase.ts` exactly. This is safe: Firebase web config values are not secrets.
//
// Pin the compat SDK version to match the `firebase` npm package's major version (see
// package.json's "firebase" dependency) to avoid runtime API drift between this worker and the
// app bundle.
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

// Fill these in with the SAME values as the VITE_FIREBASE_* variables in your `.env`
// (see web/.env.example) — this file is served as a static asset and cannot read them itself.
firebase.initializeApp({
  apiKey: '__VITE_FIREBASE_API_KEY__',
  authDomain: '__VITE_FIREBASE_AUTH_DOMAIN__',
  projectId: '__VITE_FIREBASE_PROJECT_ID__',
  storageBucket: '__VITE_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__VITE_FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__VITE_FIREBASE_APP_ID__',
});

const messaging = firebase.messaging();

// Shows a browser notification for pushes received while the tab is backgrounded or closed.
// Foreground pushes are instead handled in-app via `onForegroundPushMessage` (src/lib/firebase.ts).
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const title = notification.title || 'Device warning';
  const options = {
    body: notification.body,
    icon: '/images/logo.svg',
    data: payload.data,
  };

  self.registration.showNotification(title, options);
});
