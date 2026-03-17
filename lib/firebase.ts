import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
let messaging: Messaging | null = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.warn('[FCM] Failed to initialize messaging:', e);
  }
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('[FCM] Messaging not available');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Permission denied');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[FCM] Service Worker registered:', registration);

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    
    console.log('[FCM] Token obtained:', token);
    return token;
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void): () => void {
  if (!messaging) {
    return () => {};
  }
  
  return onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message received:', payload);
    callback(payload);
  });
}

export function isMessagingAvailable() {
  return Boolean(messaging);
}

export async function deleteNotificationToken(): Promise<boolean> {
  try {
    if (!messaging) return true;
    const ok = await deleteToken(messaging);
    console.log('[FCM] Token deleted:', ok);
    return ok;
  } catch (e) {
    console.warn('[FCM] Failed to delete token:', e);
    return false;
  }
}
