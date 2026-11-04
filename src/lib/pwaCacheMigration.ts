// These old runtime caches used broad URL matching and may contain protected
// responses. Current runtime caches have versioned names and are never deleted.
export function removeLegacyRuntimeCaches() {
  if (typeof caches === 'undefined') return;
  void Promise.all(['static-assets-cache', 'lazy-scripts-cache', 'api-cache']
    .map(name => caches.delete(name)))
    .catch(error => console.warn('Could not remove old offline caches', error));
}
