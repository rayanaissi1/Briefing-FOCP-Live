/**
 * Displays a push notification to the user indicating that the briefing is ready.
 *
 * This function checks for notification permission and service worker readiness
 * before attempting to show a notification.
 *
 * @param {string} dateString - The date of the generated briefing to display in the notification body.
 */
export const showBriefingReadyNotification = async (dateString: string): Promise<void> => {
  // 1. Check if Notification API is supported
  if (!('Notification' in window)) {
    console.warn("This browser does not support desktop notification");
    return;
  }

  // 2. Check if permission has been granted
  if (Notification.permission !== 'granted') {
    console.log("Notification permission has not been granted.");
    return;
  }

  // 3. Check if the service worker is ready
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.ready) {
      console.warn('Service worker not ready, cannot display notification.');
      return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    const notificationTitle = 'Briefing Stratégique Prêt';
    // FIX: The `vibrate` property is not in the standard NotificationOptions type.
    // Cast to `any` to allow this property, which is supported by most browsers.
    const notificationOptions: any = {
      body: `Votre analyse pour le ${dateString} est maintenant disponible.`,
      icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📊</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📊</text></svg>',
      vibrate: [200, 100, 200],
      tag: 'briefing-update', // This tag ensures that new notifications replace old ones
      renotify: true, // Vibrate and play a sound for replacement notifications
    };

    await registration.showNotification(notificationTitle, notificationOptions);
    console.log('Notification shown successfully.');

  } catch (error) {
    console.error('Error showing notification:', error);
  }
};
