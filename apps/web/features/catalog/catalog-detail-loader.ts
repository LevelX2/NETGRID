import { type CardDefinitionId } from "@netgrid/shared";
import type { CatalogCardDetail } from "./catalog-types";

type CatalogDetailFetcher = (
  cardId: CardDefinitionId,
  signal: AbortSignal,
) => Promise<CatalogCardDetail>;
type CatalogDetailConsumer = (
  cardId: CardDefinitionId,
  detail: CatalogCardDetail | null,
) => void;

export class CatalogDetailRequestCoordinator {
  private required = new Set<CardDefinitionId>();
  private readonly active = new Map<CardDefinitionId, AbortController>();
  private readonly loaded = new Set<CardDefinitionId>();
  private readonly failed = new Set<CardDefinitionId>();

  constructor(
    private readonly fetchDetail: CatalogDetailFetcher,
    private readonly consume: CatalogDetailConsumer,
  ) {}

  setRequiredCards(cardIds: readonly CardDefinitionId[]): void {
    this.required = new Set(cardIds);
    for (const [cardId, request] of this.active) {
      if (!this.required.has(cardId)) request.abort();
    }
    for (const cardId of this.failed) {
      if (!this.required.has(cardId)) this.failed.delete(cardId);
    }
    this.drain();
  }

  private drain(): void {
    for (const cardId of this.required) {
      // Leave browser connections available for card images and game traffic.
      if (this.active.size >= 2) return;
      if (
        this.loaded.has(cardId) ||
        this.active.has(cardId) ||
        this.failed.has(cardId)
      ) {
        continue;
      }
      const request = new AbortController();
      this.active.set(cardId, request);
      void this.load(cardId, request);
    }
  }

  private async load(cardId: CardDefinitionId, request: AbortController) {
    try {
      let detail: CatalogCardDetail | null;
      try {
        detail = await this.fetchDetail(cardId, request.signal);
      } catch {
        detail = null;
      }
      if (request.signal.aborted) return;
      if (detail) this.loaded.add(cardId);
      else this.failed.add(cardId);
      this.consume(cardId, detail);
    } finally {
      this.active.delete(cardId);
      this.drain();
    }
  }
}
