import { useCallback, useEffect, useState } from "react";

/**
 * Offline-first persisted state. Reads happen after hydration so the server
 * render and the first client render always agree.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* corrupt or unavailable storage: keep the initial value */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private mode */
    }
  }, [key, value, ready]);

  const reset = useCallback(() => setValue(initial), [initial]);

  return [value, setValue, ready, reset] as const;
}
