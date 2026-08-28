import { type FirebaseApp, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging, onMessage } from 'firebase/messaging';

/**
 * Firebase web config — non-secret values baked into the bundle (standard for a Firebase SPA).
 * Keep in sync with the hardcoded copy in `public/firebase-messaging-sw.js` (service workers
 * can't read Vite env vars, so that file duplicates this object literally).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

let app: FirebaseApp | undefined;
let messagingPromise: Promise<Messaging | null> | undefined;

function getFirebaseApp(): FirebaseApp | null {
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
