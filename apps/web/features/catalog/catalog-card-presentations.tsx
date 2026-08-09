"use client";

import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from "react";

import type { PublicCardPresentationsById } from "../../app/legacy-card-definition-compatibility";

const EMPTY_CARD_PRESENTATIONS: PublicCardPresentationsById = {};

const CatalogCardPresentationsContext =
  createContext<PublicCardPresentationsById>(EMPTY_CARD_PRESENTATIONS);

export function CatalogCardPresentationsProvider({
  value,
  children,
}: {
  value: PublicCardPresentationsById;
  children: ReactNode;
}) {
  return createElement(CatalogCardPresentationsContext.Provider, {
    value,
    children,
  });
}

export function useCatalogCardPresentations(): PublicCardPresentationsById {
  return useContext(CatalogCardPresentationsContext);
}

export function catalogCardPresentationsFor(
  cards: readonly {
    catalogCardId: string;
    title: string;
    type: string;
  }[],
): PublicCardPresentationsById {
  return Object.fromEntries(
    cards.map((card) => [
      card.catalogCardId,
      { title: card.title, type: card.type },
    ]),
  );
}
