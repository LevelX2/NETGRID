import { describe, expect, it, vi } from "vitest";
import {
  copyStandardDeck,
  createAccountDeck,
  deleteAccountDeck,
  loadAccountDecks,
  loadStandardDecks,
  snapshotAccountDeck,
  updateAccountDeck,
} from "./account-deck-client";

const deck = {
  deckId: "cloud_deck_1",
  deckVersion: "1",
  name: "Mein Deck",
  side: "runner" as const,
  identityCardId: "runner_identity_001",
  cardPoolSnapshotId: "card-snapshot-0.8",
  cardPoolVersion: "private-local-onr-v1",
  formatProfileId: "netgrid_private_local_v1",
  formatProfileVersion: "1.3.0",
  cards: [{ cardId: "card_1", quantity: 3 }],
  createdAt: "2026-07-18T00:00:00.000Z",
  updatedAt: "2026-07-18T00:00:00.000Z",
};

describe("account deck client", () => {
  it("uses cookie credentials and CSRF for every personal deck mutation", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const path = String(url);
      if (path.endsWith("/snapshot"))
        return response({ snapshot: { deckSnapshotId: "snapshot_1" } });
      if (path.includes("copy-standard"))
        return response({
          deck: { cloudDeckId: "copy" },
          quota: { limit: 50, used: 2, remaining: 48 },
        });
      if (path.endsWith("/api/account/decks"))
        return response({
          deck: { cloudDeckId: "created" },
          decks: [],
          quota: { limit: 50, used: 1, remaining: 49 },
        });
      return response({
        ok: true,
        deck: { cloudDeckId: "cloud_deck_1" },
        quota: { limit: 50, used: 0, remaining: 50 },
      });
    }) as unknown as typeof fetch;

    await loadAccountDecks(fetcher);
    await createAccountDeck(deck, "csrf-memory-only", fetcher);
    await copyStandardDeck("standard_runner", "csrf-memory-only", fetcher);
    await updateAccountDeck(deck, 1, "csrf-memory-only", fetcher);
    await snapshotAccountDeck(deck.deckId, "csrf-memory-only", fetcher);
    await deleteAccountDeck(deck.deckId, "csrf-memory-only", fetcher);

    const calls = (fetcher as unknown as ReturnType<typeof vi.fn>).mock
      .calls as Array<[string, RequestInit]>;
    expect(calls.every(([, init]) => init.credentials === "include")).toBe(
      true,
    );
    expect(
      calls
        .slice(1)
        .every(
          ([, init]) =>
            new Headers(init.headers).get("x-netgrid-csrf") ===
            "csrf-memory-only",
        ),
    ).toBe(true);
    expect(JSON.stringify(calls)).not.toContain("ng_account_session");
  });

  it("loads curated standards and their immutable snapshot descriptors without browser storage", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn(async () =>
      response({
        catalog: {
          decks: [
            {
              standardDeckId: "standard_runner",
              status: "active",
              guideStatus: "missing",
            },
          ],
          snapshots: [
            {
              deckSnapshotId: "standard_standard_runner_1.0.0",
              immutable: true,
            },
          ],
        },
      }),
    ) as unknown as typeof fetch;
    const loaded = await loadStandardDecks(fetcher, controller.signal);
    expect(loaded.catalog.decks).toHaveLength(1);
    expect(loaded.catalog.snapshots[0]).toMatchObject({ immutable: true });
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("/api/decks/standards"),
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});

function response(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
