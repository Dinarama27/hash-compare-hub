import { useSyncExternalStore } from "react";
import type { Algo } from "./hashing";

export type HashRecord = {
  id: string;
  source: "text" | "file";
  label: string;
  size: number;
  results: Record<Algo, { hash: string; ms: number }>;
  createdAt: number;
};

type State = { records: HashRecord[] };

const STORAGE_KEY = "hashlab.records.v1";
const EMPTY: State = { records: [] };

function load(): State {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as State;
    return parsed && Array.isArray(parsed.records) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

let state: State = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = load();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function emit() {
  for (const l of listeners) l();
}

export const store = {
  add(rec: HashRecord) {
    ensureHydrated();
    state = { records: [rec, ...state.records].slice(0, 200) };
    persist();
    emit();
  },
  clear() {
    state = EMPTY;
    persist();
    emit();
  },
  get(): State {
    ensureHydrated();
    return state;
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

// Cache the snapshot so useSyncExternalStore doesn't loop.
const getSnapshot = () => store.get();
const getServerSnapshot = () => EMPTY;

export function useStore<T>(selector: (s: State) => T): T {
  const s = useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot);
  return selector(s);
}
