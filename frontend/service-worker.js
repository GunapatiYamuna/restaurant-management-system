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
    data: {
      url: data.url || "/login/pages/reservations.html",
      comingUrl: data.coming_url || "",
      notComingUrl: data.not_coming_url || ""
    },
    requireInteraction: true,
    actions: [
      {action: "coming", title: "Coming"},
      {action: "not-coming", title: "Not Coming"}
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const data = event.notification.data || {};
  let targetUrl = data.url || "/login/pages/reservations.html";

  if (event.action === "coming" && data.comingUrl) {
    targetUrl = data.comingUrl;
  } else if (event.action === "not-coming" && data.notComingUrl) {
    targetUrl = data.notComingUrl;
  }

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
