import { describe, expect, it, vi } from "vitest";

import type { CatalogCardDetail } from "./catalog-types";
import { CatalogDetailRequestCoordinator } from "./catalog-detail-loader";

function detail(cardId: string): CatalogCardDetail {
  return {
    catalogCardId: cardId,
    title: cardId,
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
  it("delivers a resolved card without waiting for an unrelated hanging request", async () => {
    const coordinator = new CatalogDetailRequestCoordinator();
    const hanging = new Promise<CatalogCardDetail | null>(() => undefined);
    const consumed: string[] = [];

    void coordinator.ensure(
      ["stuck", "filter"],
      () => false,
      (cardId) =>
        cardId === "stuck" ? hanging : Promise.resolve(detail(cardId)),
      (card) => consumed.push(card.catalogCardId),
    );

    await vi.waitFor(() => expect(consumed).toEqual(["filter"]));
  });

  it("deduplicates concurrent requests and retries a later failed request", async () => {
    const coordinator = new CatalogDetailRequestCoordinator();
    const fetchDetail = vi
      .fn<(cardId: string) => Promise<CatalogCardDetail | null>>()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(detail("filter"));
    const consumed: string[] = [];

    await Promise.all([
      coordinator.ensure(
        ["filter"],
        () => false,
        fetchDetail,
        (card) => consumed.push(card.catalogCardId),
      ),
      coordinator.ensure(
        ["filter"],
        () => false,
        fetchDetail,
        (card) => consumed.push(card.catalogCardId),
      ),
    ]);
    expect(fetchDetail).toHaveBeenCalledTimes(1);
    expect(consumed).toEqual([]);

    await coordinator.ensure(
      ["filter"],
      () => false,
      fetchDetail,
      (card) => consumed.push(card.catalogCardId),
    );
    expect(fetchDetail).toHaveBeenCalledTimes(2);
    expect(consumed).toEqual(["filter"]);
  });
});
