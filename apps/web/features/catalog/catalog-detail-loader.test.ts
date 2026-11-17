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
  it("limits overlapping batches to two active requests and still loads every card", async () => {
    const coordinator = new CatalogDetailRequestCoordinator();
    const releases: Array<() => void> = [];
    const started: number[] = [];
    const consumed: number[] = [];
    const fetchDetail = (cardId: number) => {
      started.push(cardId);
      return new Promise<CatalogCardDetail>((resolve) => {
        releases.push(() => resolve(detail(cardId)));
      });
    };
    const consume = (card: CatalogCardDetail) =>
      consumed.push(card.catalogCardId);
    const first = coordinator.ensure(
      [1, 2, 3], () => false, fetchDetail, consume,
    );
    const second = coordinator.ensure(
      [3, 4], () => false, fetchDetail, consume,
    );
    await vi.waitFor(() => expect(started).toEqual([1, 2]));
    releases.shift()!();
    await vi.waitFor(() => expect(started).toEqual([1, 2, 3]));
    releases.shift()!();
    await vi.waitFor(() => expect(started).toEqual([1, 2, 3, 4]));
    releases.splice(0).forEach((release) => release());
    await Promise.all([first, second]);
    expect(consumed.sort()).toEqual([1, 2, 3, 4]);
  });

  it("delivers a resolved card without waiting for an unrelated hanging request", async () => {
    const coordinator = new CatalogDetailRequestCoordinator();
    const hanging = new Promise<CatalogCardDetail | null>(() => undefined);
    const consumed: number[] = [];

    void coordinator.ensure(
      [5, 6],
      () => false,
      (cardId) =>
        cardId === 5 ? hanging : Promise.resolve(detail(cardId)),
      (card) => consumed.push(card.catalogCardId),
    );

    await vi.waitFor(() => expect(consumed).toEqual([6]));
  });

  it("deduplicates concurrent requests and retries a later failed request", async () => {
    const coordinator = new CatalogDetailRequestCoordinator();
    const fetchDetail = vi
      .fn<(cardId: number) => Promise<CatalogCardDetail | null>>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(detail(6));
    const consumed: number[] = [];

    await Promise.all([
      coordinator.ensure(
        [6],
        () => false,
        fetchDetail,
        (card) => consumed.push(card.catalogCardId),
      ),
      coordinator.ensure(
        [6],
        () => false,
        fetchDetail,
        (card) => consumed.push(card.catalogCardId),
      ),
    ]);
    expect(fetchDetail).toHaveBeenCalledTimes(1);
    expect(consumed).toEqual([]);

    await coordinator.ensure(
      [6],
      () => false,
      fetchDetail,
      (card) => consumed.push(card.catalogCardId),
    );
    expect(fetchDetail).toHaveBeenCalledTimes(2);
    expect(consumed).toEqual([6]);
  });
});
