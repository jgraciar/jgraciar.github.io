/* Circuit JGR: servicio de red actualizado. Version 2026-11-10.
 * Sustituye cualquier service worker anterior que sirviera la portada
 * desde una cache obsoleta. No almacena navegaciones en cache.
 */
self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name =>
      name.startsWith("circuitjs-cache") ||
      name.startsWith("circuitjgr-cache")
    ).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate" && event.request.method === "GET") {
    event.respondWith(fetch(event.request, {cache:"no-store"}));
  }
});
