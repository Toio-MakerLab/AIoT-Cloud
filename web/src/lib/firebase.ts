import { type FirebaseApp, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging, onMessage } from 'firebase/messaging';
import { domainConfig } from './domain-config';

/**
 * Firebase web config — non-secret values (standard for a Firebase SPA), read from
 * `domainConfig` rather than `import.meta.env` directly so the same build can point at a
 * different Firebase project per deployment via domain.json (see `./domain-config`),
 * falling back to the build-time env vars when domain.json omits them.
 * Read lazily (not hoisted to a module-level const) because `loadDomainConfig()` — awaited
 * in `main.tsx` before the app renders — populates `domainConfig` asynchronously; reading it
 * eagerly at import time would always see the pre-fetch build-time defaults.
 * The service worker (`src/service-worker/firebase-messaging-sw.ts`) still reads the build-time
 * env vars directly and is bundled separately by `scripts/build-firebase-sw.mjs` into
 * `public/firebase-messaging-sw.js`.
 */
function getFirebaseConfig() {
  return {
    apiKey: domainConfig.VITE_FIREBASE_API_KEY,
    authDomain: domainConfig.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: domainConfig.VITE_FIREBASE_PROJECT_ID,
    storageBucket: domainConfig.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: domainConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: domainConfig.VITE_FIREBASE_APP_ID,
  };
}

let app: FirebaseApp | undefined;
let messagingPromise: Promise<Messaging | null> | undefined;

function getFirebaseApp(): FirebaseApp | null {
  const firebaseConfig = getFirebaseConfig();
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    return null;
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

/** Lazily resolves a Messaging instance, or null when unsupported/unconfigured. Never throws. */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      try {
        const firebaseApp = getFirebaseApp();
        if (!firebaseApp) return null;
        if (typeof window === 'undefined' || !(await isSupported())) return null;
        return getMessaging(firebaseApp);
      } catch (error) {
        console.error('[firebase] failed to initialize messaging', error);
        return null;
      }
    })();
  }
  return messagingPromise;
}

/**
 * Progressive-enhancement entry point for enabling browser push: checks support, asks for
 * Notification permission, and if granted, exchanges it for an FCM registration token.
 * Never throws — any failure (unsupported browser, denied permission, missing config) logs
 * and resolves to null so callers can toast a friendly message instead of crashing.
 */
export async function requestWebPushPermission(serviceWorkerRegistration?: ServiceWorkerRegistration): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('[firebase] Notification API not supported in this browser');
      return null;
    }

    const vapidKey = domainConfig.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[firebase] VITE_FIREBASE_VAPID_KEY is not configured');
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn('[firebase] messaging is not available/configured in this environment');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });

    return token || null;
  } catch (error) {
    console.error('[firebase] failed to obtain web push token', error);
    return null;
  }
}

/** Wraps `onMessage` for foreground (tab-focused) pushes. No-ops gracefully when unsupported. */
export function onForegroundPushMessage(callback: (payload: { title?: string; body?: string }) => void): () => void {
  let unsubscribe: (() => void) | undefined;

  void getMessagingInstance().then((messaging) => {
    if (!messaging) return;
    unsubscribe = onMessage(messaging, (payload) => {
      callback({
        title: payload.notification?.title,
        body: payload.notification?.body,
      });
    });
  });

  return () => unsubscribe?.();
}
