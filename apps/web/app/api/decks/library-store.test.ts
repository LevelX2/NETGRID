import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  afterEach(() => vi.unstubAllEnvs());

  it("keeps release decks in the installed data root, independent of the Windows account", () => {
    const root = resolve("C:/NETGRID-release-library-fixture");
    for (const account of ["OriginalUser", "ElevatedAdministrator", "SYSTEM"]) {
      expect(
        defaultDeckLibraryPath({
          NODE_ENV: "production",
          NETGRID_RUNTIME_PROFILE: "release",
          NETGRID_DATA_ROOT: root,
          APPDATA: `C:\\Users\\${account}\\AppData\\Roaming`,
        }),
      ).toBe(join(root, "runtime", "decks"));
    }
  });

  it("does not use a developer or account-local path when the release root is missing", () => {
    expect(() =>
      defaultDeckLibraryPath({
        NODE_ENV: "production",
        NETGRID_RUNTIME_PROFILE: "release",
        APPDATA: "C:\\Users\\Fixture\\AppData\\Roaming",
      }),
    ).toThrow("release_data_root_required");
    expect(() =>
      defaultDeckLibraryPath({
        NODE_ENV: "production",
        NETGRID_RUNTIME_PROFILE: "release",
        NETGRID_DATA_ROOT: "relative",
      }),
    ).toThrow("absoluter Pfad");
  });

  it("allows an explicit release library only inside its data root", () => {
    const root = resolve("C:/NETGRID-release-library-fixture");
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      NETGRID_RUNTIME_PROFILE: "release",
      NETGRID_DATA_ROOT: root,
    };
    expect(
      defaultDeckLibraryPath({
        ...env,
        NETGRID_DECK_LIBRARY_PATH: join(root, "personal-decks"),
      }),
    ).toBe(join(root, "personal-decks"));
    for (const invalid of [
      "relative/decks",
      root,
      `${root}-other`,
      resolve(root, "..", "outside"),
      "   ",
    ]) {
      expect(() =>
        defaultDeckLibraryPath({ ...env, NETGRID_DECK_LIBRARY_PATH: invalid }),
      ).toThrow("release_deck_library_outside_data_root");
    }
  });

  it("uses the application data folder on Windows by default", () => {
    expect(
      defaultDeckLibraryPath({
        APPDATA: "C:\\Users\\Lui\\AppData\\Roaming",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(join("C:\\Users\\Lui\\AppData\\Roaming", "NetGrid", "Decks"));
  });

  it("retains the account-local development library even when a data root is configured", () => {
    const appData = resolve("C:/NETGRID-development-library-fixture");
    expect(
      defaultDeckLibraryPath({
        NODE_ENV: "development",
        NETGRID_RUNTIME_PROFILE: "development",
        NETGRID_DATA_ROOT: resolve("C:/NETGRID-release-library-fixture"),
        APPDATA: appData,
      }),
    ).toBe(join(appData, "NetGrid", "Decks"));
  });

  it("reads and writes the release library without importing or changing account-local decks", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-release-decks-"));
    try {
      const root = join(dir, "installed-data");
      const appData = join(dir, "account-data");
      const accountLibrary = join(appData, "NetGrid", "Decks");
      const accountDeck = { ...runnerDeck, deckId: "account_only_deck" };
      await writeDeckLibrary([accountDeck], accountLibrary);
      const accountFile = join(accountLibrary, "account_only_deck.json");
      const before = await readFile(accountFile, "utf8");
      vi.stubEnv("NETGRID_RUNTIME_PROFILE", "release");
      vi.stubEnv("NETGRID_DATA_ROOT", root);
      vi.stubEnv("NETGRID_DECK_LIBRARY_PATH", "");
      vi.stubEnv("APPDATA", appData);

      expect(await readDeckLibrary()).toEqual({
        decks: [],
        storagePath: join(root, "runtime", "decks"),
      });
      const saved = await writeDeckLibrary([runnerDeck]);
      expect(saved.storagePath).toBe(join(root, "runtime", "decks"));
      expect((await readDeckLibrary()).decks).toEqual([
        runnerDeckNeedsRevalidation,
      ]);
      vi.stubEnv("APPDATA", join(dir, "another-account"));
      expect((await readDeckLibrary()).decks).toEqual([
        runnerDeckNeedsRevalidation,
      ]);
      expect(await readFile(accountFile, "utf8")).toBe(before);
    } finally {
      // Only remove this test's resolved mkdtemp child, never a configured root.
      if (
        !resolve(dir).startsWith(
          `${resolve(tmpdir())}${sep}netgrid-release-decks-`,
        )
      )
        throw new Error("unexpected_test_cleanup_path");
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("uses the NETGRID deck library env name when set", () => {
    expect(
      defaultDeckLibraryPath({
        NETGRID_DECK_LIBRARY_PATH: "C:\\Decks\\Netgrid",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe("C:\\Decks\\Netgrid");
    expect(
      defaultDeckLibraryPath({
        NETGRID_DECK_LIBRARY_PATH: "C:\\Decks\\Custom",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe("C:\\Decks\\Custom");
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
