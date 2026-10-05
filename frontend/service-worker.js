self.addEventListener("push", event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {title: "FoodieHub", body: "You have a new reservation notification."};
  }

  const title = data.title || "FoodieHub";
  const options = {
    body: data.body || "You have a new reservation notification.",
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    data: {
      url: data.url || "/login/pages/reservations.html"
    },
    requireInteraction: true,
    actions: [
      {action: "reservations", title: "View Reservation"}
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/login/pages/reservations.html";

  event.waitUntil(
    clients.matchAll({type: "window", includeUncontrolled: true}).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
