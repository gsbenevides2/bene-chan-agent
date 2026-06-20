self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "Nova notificação" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.description,
      icon: "/icon.png",
      image: data.image,
      data: { url: data.link },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    clients.openWindow(event.notification.data.url);
  }
});
