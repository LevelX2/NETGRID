import { existsSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hostPath = vi.hoisted(() => ({
  flavor: undefined as "posix" | "win32" | undefined,
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    // Module initialization keeps the real filesystem. Individual cases own
    // their lookup result, independently of private local deck files.
    existsSync: vi.fn((filePath: Parameters<typeof actual.existsSync>[0]) =>
      hostPath.flavor ? false : actual.existsSync(filePath),
    ),
  };
});

// Exercise both host interpretations in every OS run. Otherwise Windows
// accepts a native-only guard that fails for backslashes on Linux CI.
vi.mock("node:path", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("node:path") & { default: typeof import("node:path") }
  >();
  const host = () =>
    hostPath.flavor ? actual.default[hostPath.flavor] : actual.default;
  return {
    ...actual,
    default: {
      ...actual.default,
      resolve: (...parts: string[]) => host().resolve(...parts),
      dirname: (value: string) => host().dirname(value),
      basename: (value: string, suffix?: string) =>
        host().basename(value, suffix),
    },
  };
});

import { benchmarkDeckFromLocalEditableDeck } from "./benchmark-local-editable-deck-resolver";

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  hostPath.flavor = undefined;
});

describe.each(["posix", "win32"] as const)(
  "benchmarkDeckFromLocalEditableDeck on %s",
  (flavor) => {
    it.each([
      "",
      ".",
      "..",
      "../outside.json",
      "..\\outside.json",
      "nested/deck.json",
      "nested\\deck.json",
      "nested/..\\deck.json",
      "/absolute/deck.json",
      "C:\\absolute\\deck.json",
      "C:deck.json",
      "\\\\server\\share\\deck.json",
    ])("rejects a non-plain deck file name (%s)", (fileName) => {
      hostPath.flavor = flavor;
      const result = benchmarkDeckFromLocalEditableDeck({
        kind: "local_editable_deck",
        localDeckId: "local-test",
        expectedName: "Local Test",
        baseDir:
          flavor === "posix" ? "/benchmark-decks" : "C:\\benchmark-decks",
        fileName,
      });

      expect(result).toMatchObject({
        ok: false,
        classification: "unclear",
        reason:
          "Local Deck-Editor deck fileName must be a plain file name inside the configured decks directory.",
      });
      expect(existsSync).not.toHaveBeenCalled();
    });

    it.each(["local-test.json", "Mein Deck äöü.json"])(
      "allows a plain file name to reach file lookup (%s)",
      (fileName) => {
        hostPath.flavor = flavor;
        const result = benchmarkDeckFromLocalEditableDeck({
          kind: "local_editable_deck",
          localDeckId: "local-test",
          expectedName: "Local Test",
          baseDir:
            flavor === "posix" ? "/benchmark-decks" : "C:\\benchmark-decks",
          fileName,
        });
        expect(result).toMatchObject({
          ok: false,
          classification: "unclear",
          reason: `Local Deck-Editor deck file not found: ${fileName}`,
        });
        expect(existsSync).toHaveBeenCalledExactlyOnceWith(result.filePath);
      },
    );
  },
);
