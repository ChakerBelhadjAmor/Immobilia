"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Persistent id list in localStorage (favorites, comparison basket…).
 * Syncs across components via a custom event.
 */
export function useLocalList(key: string) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const read = () => {
      try {
        setIds(JSON.parse(localStorage.getItem(key) ?? "[]"));
      } catch {
        setIds([]);
      }
    };
    read();
    const onChange = (e: Event) => {
      if ((e as CustomEvent).detail === key) read();
    };
    window.addEventListener("local-list-change", onChange);
    return () => window.removeEventListener("local-list-change", onChange);
  }, [key]);

  const persist = useCallback(
    (next: string[]) => {
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("local-list-change", { detail: key }));
    },
    [key],
  );

  const toggle = useCallback(
    (id: string) => {
      const next = ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];
      persist(next);
    },
    [ids, persist],
  );

  const remove = useCallback(
    (id: string) => persist(ids.filter((i) => i !== id)),
    [ids, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { ids, toggle, remove, clear, has: (id: string) => ids.includes(id) };
}

export const useFavorites = () => useLocalList("immobilia:favorites");
export const useCompareList = () => useLocalList("immobilia:compare");
