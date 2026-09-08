import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import type { EditableDeck } from "@netgrid/decks";
import {
  defaultDeckLibraryPath,
  readDeckLibrary,
  writeDeckLibrary,
} from "./library-store";

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
  updatedAt: "2026-05-07T10:00:00.000Z",
};
const runnerDeckNeedsRevalidation = {
  ...runnerDeck,
  validationStatus: "needs_revalidation",
};

describe("deck file library", () => {
  it("uses APPDATA as the default application data folder when configured", () => {
    const appData = join(tmpdir(), "app-data");
    expect(
      defaultDeckLibraryPath({
        NODE_ENV: "test",
        APPDATA: appData,
      }),
    ).toBe(join(appData, "NetGrid", "Decks"));
  });

  it.each(["Netgrid", "Custom"])(
    "uses the absolute NETGRID deck library override (%s) before defaults",
    (folder) => {
      // Absolute filesystem paths must be native to the host running the test.
      const configuredPath = join(tmpdir(), "decks", folder);
      expect(
        defaultDeckLibraryPath({
          NODE_ENV: "test",
          NETGRID_DECK_LIBRARY_PATH: configuredPath,
          APPDATA: join(tmpdir(), "ignored-app-data"),
          XDG_DATA_HOME: join(tmpdir(), "ignored-xdg-data"),
        }),
      ).toBe(configuredPath);
    },
  );

  it("resolves and normalizes a relative override against the working directory", () => {
    expect(
      defaultDeckLibraryPath({
        NODE_ENV: "test",
        NETGRID_DECK_LIBRARY_PATH: "relative-decks/../selected-decks",
      }),
    ).toBe(join(process.cwd(), "selected-decks"));
  });

  it("uses XDG_DATA_HOME when APPDATA is absent", () => {
    const dataHome = join(tmpdir(), "xdg-data");
    expect(
      defaultDeckLibraryPath({ NODE_ENV: "test", XDG_DATA_HOME: dataHome }),
    ).toBe(join(dataHome, "netgrid", "decks"));
  });

  it("uses the user home when no storage environment setting is present", () => {
    expect(defaultDeckLibraryPath({ NODE_ENV: "test" })).toBe(
      join(homedir(), ".netgrid", "decks"),
    );
  });

  it("writes editable decks as local JSON files and reads them back", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-decks-"));
    try {
      await writeDeckLibrary([runnerDeck], dir);
      const file = await readFile(join(dir, "local_runner_test.json"), "utf8");
      expect(file).toContain("netgrid-editable-deck-v1");
      const result = await readDeckLibrary(dir);
      expect(result.decks).toEqual([runnerDeckNeedsRevalidation]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("removes deleted decks without failing on unrelated invalid JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-decks-"));
    try {
      await writeDeckLibrary([runnerDeck], dir);
      await writeFile(join(dir, "broken.json"), "{", "utf8");
      expect((await readDeckLibrary(dir)).decks).toEqual([
        runnerDeckNeedsRevalidation,
      ]);
      await writeDeckLibrary([], dir);
      expect((await readDeckLibrary(dir)).decks).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
