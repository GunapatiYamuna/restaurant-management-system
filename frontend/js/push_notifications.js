async function setupReservationPushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return;
  }

  if (!window.isSecureContext) {
    console.warn("Web Push requires HTTPS (localhost is also allowed for local development).");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.info("Reservation notifications are disabled by the customer.");
      return;
    }

    const keyResponse = await fetch("/api/notifications/push/public-key/", {
      credentials: "same-origin",
      cache: "no-store"
    });
    const keyData = await keyResponse.json().catch(() => ({}));
    if (!keyResponse.ok || !keyData.success || !keyData.public_key) {
      console.warn(keyData.message || "Web Push public key is not configured.");
      return;
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.public_key)
      });
    }

    await fetch("/api/notifications/push/subscribe/", {
      method: "POST",
      credentials: "same-origin",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(subscription.toJSON())
    });
  } catch (error) {
    console.error("Unable to enable reservation notifications:", error);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

document.addEventListener("DOMContentLoaded", setupReservationPushNotifications);
