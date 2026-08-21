import { describe, expect, it } from "vitest";

import {
  CATALOG_AI_INSPECTOR_OPEN_STORAGE_KEY,
  readCatalogAiInspectorOpen,
  writeCatalogAiInspectorOpen,
} from "./catalog-ai-inspector-state";

describe("Catalog AI inspector session state", () => {
  it("is fully collapsed without a saved session preference", () => {
    expect(readCatalogAiInspectorOpen(null)).toBe(false);
    expect(readCatalogAiInspectorOpen(storageWithValue(null))).toBe(false);
  });

  it("restores and updates the panel state for the active browser session", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    writeCatalogAiInspectorOpen(storage, true);
    expect(values.get(CATALOG_AI_INSPECTOR_OPEN_STORAGE_KEY)).toBe("true");
    expect(readCatalogAiInspectorOpen(storage)).toBe(true);

    writeCatalogAiInspectorOpen(storage, false);
    expect(readCatalogAiInspectorOpen(storage)).toBe(false);
  });

  it("fails closed when browser storage is unavailable", () => {
    const unavailableStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readCatalogAiInspectorOpen(unavailableStorage)).toBe(false);
    expect(() =>
      writeCatalogAiInspectorOpen(unavailableStorage, true),
    ).not.toThrow();
  });
});

function storageWithValue(value: string | null): Pick<Storage, "getItem"> {
  return {
    getItem: () => value,
  };
}
