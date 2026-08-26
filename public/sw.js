const CACHE = "nail-studio-shell-v1";
const SHELL = ["/offline.html", "/icons/icon.svg"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/auth/") || url.pathname === "/login") return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.headers.has("set-cookie") || response.headers.get("cache-control")?.includes("private")) return response;
      return response;
    }).catch(() => caches.match("/offline.html")));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok && !response.headers.has("set-cookie")) caches.open(CACHE).then((cache) => cache.put(request, response.clone())); return response; })));
  }
});
