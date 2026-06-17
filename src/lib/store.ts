import { useSyncExternalStore } from "react";
import type { Algo } from "./hashing";

export type HashRecord = {
  id: string;
  source: "text" | "file";
  label: string; // text preview or file name
  size: number; // bytes
  results: Record<Algo, { hash: string; ms: number }>;
  createdAt: number;
};

type State = {
  records: HashRecord[];
};

let state: State = { records: [] };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const store = {
  add(rec: HashRecord) {
    state = { records: [rec, ...state.records].slice(0, 200) };
    emit();
  },
  clear() {
    state = { records: [] };
    emit();
  },
  get() {
    return state;
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => selector(store.get()),
    () => selector({ records: [] })
  );
}
