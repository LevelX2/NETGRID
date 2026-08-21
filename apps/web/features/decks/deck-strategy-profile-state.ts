export const DECK_STRATEGY_PROFILE_OPEN_STORAGE_KEY =
  "netgrid.deck-editor.strategy-profile.open";

type SessionStorageReader = Pick<Storage, "getItem">;
type SessionStorageWriter = Pick<Storage, "setItem">;

export function readDeckStrategyProfileOpen(
  storage: SessionStorageReader | null,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(DECK_STRATEGY_PROFILE_OPEN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeDeckStrategyProfileOpen(
  storage: SessionStorageWriter | null,
  isOpen: boolean,
): void {
  if (!storage) return;
  try {
    storage.setItem(
      DECK_STRATEGY_PROFILE_OPEN_STORAGE_KEY,
      isOpen ? "true" : "false",
    );
  } catch {
    // Der Klappzustand bleibt optionaler lokaler Komfortzustand.
  }
}
