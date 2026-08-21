import { describe, expect, it } from "vitest";

import {
  AI_DETAIL_INFORMATION_STORAGE_KEY,
  readAiDetailInformationEnabled,
  writeAiDetailInformationEnabled,
} from "./ai-detail-information-setting";

describe("AI detail information setting", () => {
  it("keeps the diagnostic detail surfaces disabled by default", () => {
    expect(readAiDetailInformationEnabled(null)).toBe(false);
    expect(readAiDetailInformationEnabled(storageWithValue(null))).toBe(false);
  });

  it("persists both explicit settings", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    writeAiDetailInformationEnabled(storage, false);
    expect(values.get(AI_DETAIL_INFORMATION_STORAGE_KEY)).toBe("false");
    expect(readAiDetailInformationEnabled(storage)).toBe(false);

    writeAiDetailInformationEnabled(storage, true);
    expect(readAiDetailInformationEnabled(storage)).toBe(true);
  });

  it("keeps the diagnostic display hidden when browser storage is blocked", () => {
    const unavailableStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readAiDetailInformationEnabled(unavailableStorage)).toBe(false);
    expect(() =>
      writeAiDetailInformationEnabled(unavailableStorage, false),
    ).not.toThrow();
  });
});

function storageWithValue(value: string | null): Pick<Storage, "getItem"> {
  return { getItem: () => value };
}
