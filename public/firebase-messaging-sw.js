importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCs1WDkpHyHNW2DVhVDUdV6YW9OWNHNJ6k",
  authDomain: "apexucode.firebaseapp.com",
  projectId: "apexucode",
  storageBucket: "apexucode.firebasestorage.app",
  messagingSenderId: "584550030112",
  appId: "1:584550030112:web:e2371c94c35c36100c9545"
});

const messaging = firebase.messaging();

// Take control ASAP
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Receive active conversation state from the app (via BroadcastChannel)
let ACTIVE_STATE = { id: null, isActive: false };
try {
  const bc = new BroadcastChannel('cch-active-conv');
  bc.onmessage = (event) => {
    const data = event?.data || {};
    ACTIVE_STATE = {
      id: data?.id || null,
      isActive: Boolean(data?.isActive),
    };
    // console.log('[SW] Active state updated:', ACTIVE_STATE);
  };
} catch (_) {
  // BroadcastChannel not available; ignore. We'll fallback to clients inspection only.
}

// Also support direct postMessage from controlled clients
self.addEventListener('message', (event) => {
  try {
    const data = event?.data || {};
    if (data?.type === 'cch-active-conv') {
      ACTIVE_STATE = {
        id: data?.id || null,
        isActive: Boolean(data?.isActive),
      };
      // console.log('[SW] Active state updated via postMessage:', ACTIVE_STATE);
    }
  } catch (_) {
    // ignore
  }
});

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const convId = payload?.data?.conversationId;

  // Helper to decide suppression based on current windows
  const shouldSuppress = (clientsArr) => {
    try {
      const hasVisibleLive = (clientsArr || []).some((c) => {
        const url = c?.url || '';
        const isLiveChat = url.includes('/live-chat');
        const isVisible = (typeof c.visibilityState === 'string') ? (c.visibilityState === 'visible') : true;
        return isLiveChat && isVisible;
      });
      return Boolean(
        convId && ACTIVE_STATE?.id && String(convId) === String(ACTIVE_STATE.id) && ACTIVE_STATE.isActive && hasVisibleLive
      );
    } catch (_) {
      return false;
    }
  };

  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    if (shouldSuppress(list)) {
      console.log('[SW] ✅ SUPPRESSED (active conversation visible):', convId);
      return;
    }

    const notificationTitle = payload.notification?.title || 'CconeHub';
    const notificationOptions = {
      body: payload.notification?.body || 'Nuevo mensaje',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data,
      tag: 'cconehub-push',
      requireInteraction: true,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const conversationId = event.notification.data?.conversationId;
  const url = conversationId 
    ? `/live-chat?conversationId=${conversationId}`
    : '/live-chat';
  
  event.waitUntil(
    clients.openWindow(url)
  );
});
