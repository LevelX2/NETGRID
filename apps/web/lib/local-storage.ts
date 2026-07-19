import { DISPLAY_NAME_STORAGE_KEY } from "./storage-keys";

export function rememberDisplayName(name: string): void {
  const trimmed = name.trim();
  if (trimmed) window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, trimmed);
}

export function readLocalStorage(key: string): string | null {
  return window.localStorage.getItem(key);
}

export function removeLocalStorageKey(key: string): void {
  window.localStorage.removeItem(key);
}
