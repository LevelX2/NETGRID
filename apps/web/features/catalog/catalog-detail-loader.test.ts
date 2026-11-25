import { describe, expect, it, vi } from "vitest";

import type { CatalogCardDetail } from "./catalog-types";
import { CatalogDetailRequestCoordinator } from "./catalog-detail-loader";

function detail(cardId: number): CatalogCardDetail {
  return {
    catalogCardId: cardId,
    title: String(cardId),
    side: "corp",
    type: "ice",
    subtypes: [],
    faction: "test",
    setId: "test",
    statuses: {
      imported: true,
      validated: true,
      catalog_ready: true,
      implemented: true,
      engine_supported: true,
      playable: true,
      human_playable: true,
      ai_supported: true,
      deck_legal: true,
      format_legal: true,
      blocked: false,
    },
    blockReasons: [],
    setName: "Test",
    collectorNumber: "1",
    text: "",
    numeric: { rezCost: 1, strength: 1 },
    engineCardId: cardId,
  };
}

describe("CatalogDetailRequestCoordinator", () => {
  it("limits requests to two at a time and keeps loaded cards", async () => {
    const releases: Array<() => void> = [];
    const started: number[] = [];
    const consumed: number[] = [];
    const fetchDetail = (cardId: number) => {
      started.push(cardId);
      return new Promise<CatalogCardDetail>((resolve) => {
        releases.push(() => resolve(detail(cardId)));
      });
    };
    const coordinator = new CatalogDetailRequestCoordinator(
      fetchDetail,
      (cardId, card) => {
        if (card) consumed.push(cardId);
      },
    );
    coordinator.setRequiredCards([1, 2, 3, 3, 4]);
    expect(started).toEqual([1, 2]);
    releases.shift()!();
    await vi.waitFor(() => expect(started).toEqual([1, 2, 3]));
    releases.shift()!();
    await vi.waitFor(() => expect(started).toEqual([1, 2, 3, 4]));
    releases.splice(0).forEach((release) => release());
    await vi.waitFor(() => expect(consumed).toEqual([1, 2, 3, 4]));
    coordinator.setRequiredCards([2, 4]);
    expect(started).toEqual([1, 2, 3, 4]);
  });

  it("delivers a resolved card without waiting for an unrelated hanging request", async () => {
    const hanging = new Promise<CatalogCardDetail>(() => undefined);
    const consumed: number[] = [];

    const coordinator = new CatalogDetailRequestCoordinator(
      (cardId) => (cardId === 5 ? hanging : Promise.resolve(detail(cardId))),
      (cardId, card) => {
        if (card) consumed.push(cardId);
      },
    );
    coordinator.setRequiredCards([5, 6]);

    await vi.waitFor(() => expect(consumed).toEqual([6]));
  });

  it("cancels obsolete requests and preserves ones the new view still needs", async () => {
    const requests = new Map<
      number,
      { signal: AbortSignal; release(): void }
    >();
    const consume = vi.fn();
    const coordinator = new CatalogDetailRequestCoordinator(
      (id, signal) =>
        new Promise((resolve) => {
          requests.set(id, { signal, release: () => resolve(detail(id)) });
        }),
      consume,
    );

    coordinator.setRequiredCards([1, 2, 3]);
    coordinator.setRequiredCards([2, 4]);
    expect(requests.get(1)?.signal.aborted).toBe(true);
    expect(requests.get(2)?.signal.aborted).toBe(false);
    requests.get(1)?.release();
    await vi.waitFor(() => expect([...requests.keys()]).toEqual([1, 2, 4]));
    requests.get(2)?.release();
    requests.get(4)?.release();
    await vi.waitFor(() =>
      expect(consume.mock.calls.map(([id]) => id)).toEqual([2, 4]),
    );
  });

  it("reports a failed request once and retries on renewed demand", async () => {
    const fetchDetail = vi
      .fn<(cardId: number) => Promise<CatalogCardDetail>>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(detail(6));
    const consume = vi.fn();
    const coordinator = new CatalogDetailRequestCoordinator(
      fetchDetail,
      consume,
    );

    coordinator.setRequiredCards([6]);
    coordinator.setRequiredCards([6]);
    await vi.waitFor(() => expect(consume).toHaveBeenCalledWith(6, null));
    coordinator.setRequiredCards([6]);
    expect(fetchDetail).toHaveBeenCalledTimes(1);

    coordinator.setRequiredCards([]);
    coordinator.setRequiredCards([6]);
    await vi.waitFor(() =>
      expect(consume).toHaveBeenLastCalledWith(6, detail(6)),
    );
    expect(fetchDetail).toHaveBeenCalledTimes(2);
  });
});
