import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import type { EditableDeck } from "@netgrid/decks";
import { defaultDeckLibraryPath, readDeckLibrary, writeDeckLibrary } from "./library-store";

const runnerDeck: EditableDeck = {
  deckId: "local_runner_test",
  deckVersion: "0.6.0-local",
  name: "Runner Test",
  side: "runner",
  identityCardId: "runner_identity_001",
  cardPoolSnapshotId: "card-snapshot-0.8",
  formatProfileId: "local-demo-v0.8",
  cards: [{ cardId: "v08_runner_event_easy_mark", quantity: 2 }],
  createdAt: "2026-05-07T10:00:00.000Z",
  updatedAt: "2026-05-07T10:00:00.000Z"
};

describe("deck file library", () => {
  it("uses the application data folder on Windows by default", () => {
    expect(defaultDeckLibraryPath({ APPDATA: "C:\\Users\\Lui\\AppData\\Roaming" } as unknown as NodeJS.ProcessEnv)).toBe(join("C:\\Users\\Lui\\AppData\\Roaming", "NetGrid", "Decks"));
  });

  it("prefers the NETGRID deck library env name and keeps the legacy fallback", () => {
    expect(defaultDeckLibraryPath({ NETGRID_DECK_LIBRARY_PATH: "C:\\Decks\\Netgrid", NETRUNNER_DECK_LIBRARY_PATH: "C:\\Decks\\Legacy" } as unknown as NodeJS.ProcessEnv)).toBe("C:\\Decks\\Netgrid");
    expect(defaultDeckLibraryPath({ NETRUNNER_DECK_LIBRARY_PATH: "C:\\Decks\\Legacy" } as unknown as NodeJS.ProcessEnv)).toBe("C:\\Decks\\Legacy");
  });

  it("writes editable decks as local JSON files and reads them back", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-decks-"));
    try {
      await writeDeckLibrary([runnerDeck], dir);
      const file = await readFile(join(dir, "local_runner_test.json"), "utf8");
      expect(file).toContain("netgrid-editable-deck-v1");
      const result = await readDeckLibrary(dir);
      expect(result.decks).toEqual([runnerDeck]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("removes deleted decks without failing on unrelated invalid JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-decks-"));
    try {
      await writeDeckLibrary([runnerDeck], dir);
      await writeFile(join(dir, "broken.json"), "{", "utf8");
      expect((await readDeckLibrary(dir)).decks).toEqual([runnerDeck]);
      await writeDeckLibrary([], dir);
      expect((await readDeckLibrary(dir)).decks).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
