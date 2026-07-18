import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AccountSessionService, SqliteAccountStorage } from "./account-session";
import { AccountDeckService, InMemoryAccountDeckStorage, SqliteAccountDeckStorage } from "./account-decks";

const tempDirs: string[] = [];
afterEach(async () => {
  for (const directory of tempDirs.splice(0)) await rm(directory, { recursive: true, force: true });
});

describe("AccountDeckService", () => {
  it("publishes only curated standards and snapshots all of them as valid immutable decks", () => {
    const service = new AccountDeckService(new InMemoryAccountDeckStorage());
    const standards = service.listStandards();
    expect(standards).toHaveLength(40);
    expect(standards.every((deck) => deck.status === "active" && deck.standardDeckId.startsWith("standard_"))).toBe(true);
    for (const standard of standards) {
      const snapshot = service.standardSnapshot(standard.standardDeckId);
      expect(snapshot).toMatchObject({ immutable: true, side: standard.side, validation: { ok: true } });
      expect(service.standardSnapshot(standard.standardDeckId).deckHash).toBe(snapshot.deckHash);
      expect(JSON.stringify(snapshot)).not.toMatch(/internal_ai|test_fixture|retire|ownerAccountId|cloudDeckId/);
    }
  });

  it("enforces owner isolation, quota, optimistic versions, copy and immutable snapshots", async () => {
    let tick = 0;
    const service = new AccountDeckService(new InMemoryAccountDeckStorage(), { limit: 2, now: () => `2026-07-18T00:00:0${tick++}.000Z` });
    const standard = service.listStandards()[0]!;
    const first = await service.copyStandard("acct_a", standard.standardDeckId, "Eigene Kopie");
    expect(first).toMatchObject({ ownerAccountId: "acct_a", deckVersion: 1, validationStatus: "valid", deck: { name: "Eigene Kopie" } });
    await expect(service.get("acct_b", first.cloudDeckId)).rejects.toMatchObject({ code: "account_deck_not_found" });

    const updated = await service.update("acct_a", first.cloudDeckId, 1, { ...draftFromStandard(standard), name: "Überarbeitet" });
    expect(updated.deckVersion).toBe(2);
    await expect(service.update("acct_a", first.cloudDeckId, 1, draftFromStandard(standard))).rejects.toMatchObject({ code: "account_deck_version_conflict" });

    const second = await service.create("acct_a", { ...draftFromStandard(standard), name: "Zweites Deck" });
    await expect(service.create("acct_a", { ...draftFromStandard(standard), name: "51. Deck" })).rejects.toMatchObject({ code: "account_deck_limit_reached" });
    expect((await service.list("acct_a")).quota).toEqual({ limit: 2, used: 2, remaining: 0 });

    const snapshot = await service.snapshot("acct_a", updated.cloudDeckId);
    expect(snapshot).toMatchObject({ immutable: true, name: "Überarbeitet", validation: { ok: true } });
    await service.delete("acct_a", second.cloudDeckId);
    expect((await service.list("acct_a")).quota).toEqual({ limit: 2, used: 1, remaining: 1 });
  });

  it("stores invalid drafts but refuses to hand them to match setup", async () => {
    const service = new AccountDeckService(new InMemoryAccountDeckStorage());
    const standard = service.listStandards()[0]!;
    const draft = await service.create("acct_a", { ...draftFromStandard(standard), name: "Unvollständiger Entwurf", cards: [] });
    expect(draft.validationStatus).toBe("invalid");
    await expect(service.snapshot("acct_a", draft.cloudDeckId)).rejects.toMatchObject({ code: "account_deck_invalid" });
  });

  it("enforces the quota inside the shared SQLite transaction", async () => {
    const directory = await mkdtemp(join(tmpdir(), "netgrid-account-decks-"));
    tempDirs.push(directory);
    const dbPath = join(directory, "netgrid.sqlite");
    const accountStorage = new SqliteAccountStorage({ dbPath, backupDir: join(directory, "backups") });
    const accounts = new AccountSessionService(accountStorage, { tokenSalt: "sqlite-account-decks" });
    await accounts.createAccount({ accountId: "acct_sqlite", loginName: "sqlite-user", displayName: "SQLite User" });
    const deckStorage = new SqliteAccountDeckStorage({ dbPath, backupDir: join(directory, "backups") });
    const service = new AccountDeckService(deckStorage, { limit: 1 });
    const standard = service.listStandards()[0]!;
    try {
      const results = await Promise.allSettled([
        service.create("acct_sqlite", { ...draftFromStandard(standard), name: "Parallel A" }),
        service.create("acct_sqlite", { ...draftFromStandard(standard), name: "Parallel B" }),
      ]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
      expect((await service.list("acct_sqlite")).quota).toEqual({ limit: 1, used: 1, remaining: 0 });
    } finally {
      service.close();
      accountStorage.close();
    }
  });
});

function draftFromStandard(standard: ReturnType<AccountDeckService["listStandards"]>[number]) {
  return {
    name: standard.name,
    side: standard.side,
    identityCardId: standard.identityCardId,
    cardPoolSnapshotId: standard.cardPoolSnapshotId,
    ...(standard.cardPoolVersion ? { cardPoolVersion: standard.cardPoolVersion } : {}),
    formatProfileId: standard.formatProfileId,
    ...(standard.formatProfileVersion ? { formatProfileVersion: standard.formatProfileVersion } : {}),
    cards: standard.cards,
  };
}
