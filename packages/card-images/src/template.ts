import {
  createRuntimeCardsById,
  type CatalogCard,
  type CatalogSide,
} from "@netgrid/catalog";
import { serializeCardImageMappingCsv } from "./csv";

export type CardImageTemplateOptions = {
  setId?: string;
  side?: CatalogSide;
  missingPrintingIds?: ReadonlySet<string>;
};

export function currentCardImageTemplateCards(
  options: CardImageTemplateOptions = {},
): CatalogCard[] {
  return Object.values(createRuntimeCardsById())
    .filter((card) => !options.setId || card.setId === options.setId)
    .filter((card) => !options.side || card.side === options.side)
    .filter(
      (card) =>
        !options.missingPrintingIds ||
        options.missingPrintingIds.has(card.printingId),
    )
    .sort(compareTemplateCards);
}

export function createCurrentCardImageMappingTemplate(
  options: CardImageTemplateOptions = {},
): string {
  return serializeCardImageMappingCsv(currentCardImageTemplateCards(options));
}

function compareTemplateCards(left: CatalogCard, right: CatalogCard): number {
  return (
    left.setId.localeCompare(right.setId) ||
    left.side.localeCompare(right.side) ||
    left.collectorNumber.localeCompare(right.collectorNumber, "en", {
      numeric: true,
    }) ||
    left.printingId.localeCompare(right.printingId)
  );
}
