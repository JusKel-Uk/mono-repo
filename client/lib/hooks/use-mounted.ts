import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Returns false during SSR and the first client (hydration) render, true after
 * mount. Use it to gate reads of persisted client stores so the first client
 * render matches the server and avoids a hydration mismatch.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
