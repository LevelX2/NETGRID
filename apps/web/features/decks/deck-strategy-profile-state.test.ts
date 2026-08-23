import { describe, expect, it } from "vitest";

import {
  DECK_STRATEGY_PROFILE_OPEN_STORAGE_KEY,
  readDeckStrategyProfileOpen,
  writeDeckStrategyProfileOpen,
} from "./deck-strategy-profile-state";

describe("diagnostic deck strategy profile session state", () => {
  it("is fully collapsed without a saved session preference", () => {
    expect(readDeckStrategyProfileOpen(null)).toBe(false);
    expect(readDeckStrategyProfileOpen(storageWithValue(null))).toBe(false);
  });

  it("restores the open and closed state in the active tab session", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    writeDeckStrategyProfileOpen(storage, true);
    expect(values.get(DECK_STRATEGY_PROFILE_OPEN_STORAGE_KEY)).toBe("true");
    expect(readDeckStrategyProfileOpen(storage)).toBe(true);

    writeDeckStrategyProfileOpen(storage, false);
    expect(readDeckStrategyProfileOpen(storage)).toBe(false);
  });
});

function storageWithValue(value: string | null): Pick<Storage, "getItem"> {
  return { getItem: () => value };
}
