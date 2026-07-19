import type { CatalogCardDetail } from "./catalog-types";

type CatalogDetailFetcher = (
  cardId: string,
) => Promise<CatalogCardDetail | null>;
type CatalogDetailConsumer = (detail: CatalogCardDetail) => void;
type CatalogDetailPresenceCheck = (cardId: string) => boolean;

export class CatalogDetailRequestCoordinator {
  private readonly pendingByCardId = new Map<string, Promise<void>>();

  async ensure(
    cardIds: readonly string[],
    isLoaded: CatalogDetailPresenceCheck,
    fetchDetail: CatalogDetailFetcher,
    consumeDetail: CatalogDetailConsumer,
  ): Promise<void> {
    const requests = Array.from(new Set(cardIds)).flatMap((cardId) => {
      if (!cardId || isLoaded(cardId)) return [];
      const pending = this.pendingByCardId.get(cardId);
      if (pending) return [pending];

      const request = fetchDetail(cardId)
        .then((detail) => {
          if (detail) consumeDetail(detail);
        })
        .catch(() => undefined)
        .finally(() => {
          this.pendingByCardId.delete(cardId);
        });
      this.pendingByCardId.set(cardId, request);
      return [request];
    });

    await Promise.all(requests);
  }
}
