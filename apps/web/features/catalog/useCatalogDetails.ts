"use client";

import type { CardDefinitionId } from "@netgrid/shared";
import { useEffect, useState } from "react";
import { CatalogDetailRequestCoordinator } from "./catalog-detail-loader";
import type { CatalogCardDetail } from "./catalog-types";

export function useCatalogDetails(cardIds: readonly CardDefinitionId[]) {
  const [cardDetailsById, setCardDetailsById] = useState<
    Record<string, CatalogCardDetail>
  >({});
  const [failedDetailIds, setFailedDetailIds] = useState<
    ReadonlySet<CardDefinitionId>
  >(() => new Set());
  const [coordinator] = useState(
    () =>
      new CatalogDetailRequestCoordinator(
        loadCatalogDetail,
        (cardId, detail) => {
          if (detail) {
            setCardDetailsById((current) => ({ ...current, [cardId]: detail }));
          } else {
            setFailedDetailIds((current) =>
              current.has(cardId) ? current : new Set([...current, cardId]),
            );
          }
        },
      ),
  );

  useEffect(() => {
    coordinator.setRequiredCards(cardIds);
  }, [coordinator, cardIds]);

  useEffect(() => () => coordinator.setRequiredCards([]), [coordinator]);

  return { cardDetailsById, failedDetailIds };
}

async function loadCatalogDetail(
  cardId: CardDefinitionId,
  signal: AbortSignal,
) {
  const response = await fetch(
    `/api/cards/catalog/${encodeURIComponent(cardId)}`,
    { cache: "no-store", signal },
  );
  if (!response.ok) throw new Error("catalog_detail_request_failed");
  const data = (await response.json()) as { card?: CatalogCardDetail };
  if (data.card?.catalogCardId !== cardId) {
    throw new Error("catalog_detail_invalid");
  }
  return data.card;
}
