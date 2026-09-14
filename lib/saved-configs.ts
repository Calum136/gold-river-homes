import type { ConfiguratorState } from "./pricing";
import { sanitizeState } from "./state";

// ============================================
// Named saves: configurations the buyer names and keeps in this browser's
// localStorage, newest first. No backend.
//
// Read the list with
//   useSyncExternalStore(subscribeSavedConfigurations, getSavedConfigurations, getServerSavedConfigurations)
// so every view of it, in every open tab, stays in step. Every saved state
// passes through sanitizeState() on the way out, like any other saved data.
// ============================================

export const SAVED_CONFIGS_KEY = "grh-saved-configs-v1";
export const SAVED_NAME_MAX_LENGTH = 60;

export interface SavedConfiguration {
  id: string;
  name: string;
  /** ISO 8601 time it was last saved. */
  savedAt: string;
  state: ConfiguratorState;
}

export type SaveResult =
  | { ok: true; saved: SavedConfiguration; replaced: boolean }
  | { ok: false; reason: "empty" | "duplicate" | "unavailable" };

const EMPTY: SavedConfiguration[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedList: SavedConfiguration[] = EMPTY;

/** Collapses whitespace, trims and caps the length. An empty result means no usable name. */
export function normalizeSavedName(name: string): string {
  return Array.from(name.replace(/\s+/g, " ").trim()).slice(0, SAVED_NAME_MAX_LENGTH).join("").trim();
}

const sameName = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

function parse(raw: string | null): SavedConfiguration[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY;
    return data.flatMap((entry): SavedConfiguration[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const { id, name, savedAt, state } = entry as Record<string, unknown>;
      if (typeof id !== "string" || !id || typeof name !== "string" || typeof savedAt !== "string") return [];
      const cleanName = normalizeSavedName(name);
      return cleanName ? [{ id, name: cleanName, savedAt, state: sanitizeState(state) }] : [];
    });
  } catch {
    return EMPTY;
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(SAVED_CONFIGS_KEY);
  } catch {
    return null;
  }
}

function write(list: SavedConfiguration[]): boolean {
  try {
    window.localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(list));
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}

function newId(): string {
  const crypto = globalThis.crypto;
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The saved configurations, newest first. Returns the same array until the list changes. */
export function getSavedConfigurations(): SavedConfiguration[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parse(raw);
  }
  return cachedList;
}

/** The server has no saves; the list appears once the page runs in the browser. */
export function getServerSavedConfigurations(): SavedConfiguration[] {
  return EMPTY;
}

export function subscribeSavedConfigurations(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SAVED_CONFIGS_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Saves under `name`. A save with the same name (ignoring case) is replaced and moves to the top. */
export function saveConfiguration(name: string, state: ConfiguratorState): SaveResult {
  const cleanName = normalizeSavedName(name);
  if (!cleanName) return { ok: false, reason: "empty" };
  const list = getSavedConfigurations();
  const existing = list.find((s) => sameName(s.name, cleanName));
  const saved: SavedConfiguration = {
    id: existing?.id ?? newId(),
    name: cleanName,
    savedAt: new Date().toISOString(),
    state,
  };
  if (!write([saved, ...list.filter((s) => s.id !== saved.id)])) return { ok: false, reason: "unavailable" };
  return { ok: true, saved, replaced: !!existing };
}

/** Renames a save. Refuses an empty name or one another save already has. */
export function renameSavedConfiguration(id: string, name: string): SaveResult {
  const cleanName = normalizeSavedName(name);
  if (!cleanName) return { ok: false, reason: "empty" };
  const list = getSavedConfigurations();
  const target = list.find((s) => s.id === id);
  if (!target) return { ok: false, reason: "unavailable" };
  if (list.some((s) => s.id !== id && sameName(s.name, cleanName))) return { ok: false, reason: "duplicate" };
  const renamed = { ...target, name: cleanName };
  if (!write(list.map((s) => (s.id === id ? renamed : s)))) return { ok: false, reason: "unavailable" };
  return { ok: true, saved: renamed, replaced: false };
}

export function deleteSavedConfiguration(id: string): boolean {
  return write(getSavedConfigurations().filter((s) => s.id !== id));
}
