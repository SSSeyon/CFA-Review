const CACHE = "cfa-review-v4";
const OFFLINE_ASSETS = [
  "./",
  "./index.html"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Daily reminder via Periodic Background Sync (supported browsers / installed PWA)
self.addEventListener("periodicsync", e => {
  if(e.tag === "cfa-daily"){
    e.waitUntil(
      self.registration.showNotification("CFA Review", {
        body: "Keep your streak alive — a 2-minute refresher is waiting.",
        icon: "icon-192.png",
        badge: "icon-192.png",
        tag: "cfa-daily"
      })
    );
  }
});

// Focus (or open) the app when a notification is tapped
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({type:"window", includeUncontrolled:true}).then(list => {
      for(const c of list){ if("focus" in c) return c.focus(); }
      if(self.clients.openWindow) return self.clients.openWindow("./");
    })
  );
});

self.addEventListener("fetch", e => {
  // Network first for Firebase and Google Fonts, cache fallback for everything else
  if(e.request.url.includes("firebase") || e.request.url.includes("googleapis.com")){
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
