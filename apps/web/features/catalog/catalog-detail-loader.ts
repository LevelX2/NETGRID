import type { CatalogCardDetail } from "./catalog-types";

type CatalogDetailFetcher = (
  cardId: string,
) => Promise<CatalogCardDetail | null>;
type CatalogDetailConsumer = (detail: CatalogCardDetail) => void;
type CatalogDetailPresenceCheck = (cardId: string) => boolean;

export class CatalogDetailRequestCoordinator {
  private readonly pendingByCardId = new Map<string, Promise<void>>();
  private readonly queue: Array<() => void> = [];
  private activeRequests = 0;

  // Leave browser connections available for card images and game traffic.
  private schedule<T>(load: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(() => {
        this.activeRequests += 1;
        Promise.resolve()
          .then(load)
          .then(resolve, reject)
          .finally(() => {
            this.activeRequests -= 1;
            this.drain();
          });
      });
      this.drain();
    });
  }

  private drain(): void {
    while (this.activeRequests < 2 && this.queue.length > 0) {
      this.queue.shift()!();
    }
  }

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

      const request = this.schedule(() => fetchDetail(cardId))
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
