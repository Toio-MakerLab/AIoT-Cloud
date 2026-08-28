import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare const self: ServiceWorkerGlobalScope;

/**
 * Bundled (not CDN-loaded) on purpose: importScripts('https://www.gstatic.com/...') inside a
 * service worker is subject to the page's script-src(-elem) CSP, which we don't fully control in
 * every deployment (reverse proxy / CDN layers can tighten it beyond this repo's own headers).
 * Bundling the modular SDK here means the worker never fetches a third-party script at runtime.
 * Built by `scripts/build-firebase-sw.mjs` into `public/firebase-messaging-sw.js` before dev/build
 * — see that script for how these `import.meta.env.VITE_FIREBASE_*` reads get replaced.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title ?? 'Device warning';
  const options: NotificationOptions = {
    body: payload.notification?.body,
    data: payload.data,
  };

  void self.registration.showNotification(title, options);
});
