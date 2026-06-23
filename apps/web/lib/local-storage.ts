import { DISPLAY_NAME_STORAGE_KEY } from "./storage-keys";

export function rememberDisplayName(name: string): void {
  const trimmed = name.trim();
  if (trimmed) window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, trimmed);
}

export function readLocalStorageWithLegacy(key: string, legacyKey: string): string | null {
  const current = window.localStorage.getItem(key);
  if (current !== null) return current;
  const legacy = window.localStorage.getItem(legacyKey);
  if (legacy !== null) window.localStorage.setItem(key, legacy);
  return legacy;
}

export function removeLocalStorageKeys(key: string, legacyKey: string): void {
  window.localStorage.removeItem(key);
  if (legacyKey !== key) window.localStorage.removeItem(legacyKey);
}
