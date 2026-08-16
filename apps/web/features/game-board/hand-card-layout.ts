const DEFAULT_OVERLAP_RATIO = 0.42;

export const HAND_CARD_MINIMUM_VISIBLE_STEP_PX = 32;

export type HandCardRowLayout = {
  cardsPerRow: number;
  overlapOffsetPx: number | null;
  rowCount: number;
};

export function handCardRowLayout({
  availableWidth,
  cardWidth,
  cardGap,
  count,
  maxRows = 1,
  minimumVisibleStep = HAND_CARD_MINIMUM_VISIBLE_STEP_PX,
}: {
  availableWidth: number;
  cardWidth: number;
  cardGap: number;
  count: number;
  maxRows?: number;
  minimumVisibleStep?: number;
}): HandCardRowLayout {
  const normalizedCount = Math.max(0, Math.floor(count));
  if (normalizedCount <= 1 || cardWidth <= 0 || availableWidth <= 0) {
    return {
      cardsPerRow: Math.max(1, normalizedCount),
      overlapOffsetPx: null,
      rowCount: normalizedCount === 0 ? 0 : 1,
    };
  }

  const normalizedMaxRows = Math.max(1, Math.floor(maxRows));
  const minimumStep = Math.min(
    cardWidth + cardGap,
    Math.max(1, minimumVisibleStep),
  );
  const singleRowStep = (availableWidth - cardWidth) / (normalizedCount - 1);
  const maximumCardsAtMinimumStep = Math.max(
    1,
    1 + Math.floor(Math.max(0, availableWidth - cardWidth) / minimumStep),
  );
  const rowCount =
    singleRowStep >= minimumStep || normalizedMaxRows === 1
      ? 1
      : Math.min(
          normalizedMaxRows,
          Math.ceil(normalizedCount / maximumCardsAtMinimumStep),
        );
  const cardsPerRow = Math.ceil(normalizedCount / rowCount);
  const defaultOffset = cardWidth * DEFAULT_OVERLAP_RATIO;
  const defaultRowWidth =
    cardWidth * cardsPerRow +
    (cardGap - defaultOffset) * (cardsPerRow - 1);
  const requiredOffset =
    (cardWidth * cardsPerRow +
      cardGap * (cardsPerRow - 1) -
      availableWidth) /
    (cardsPerRow - 1);
  const maxOffset = Math.max(defaultOffset, cardWidth + cardGap - minimumStep);
  const overlapOffset =
    defaultRowWidth <= availableWidth
      ? defaultOffset
      : Math.min(Math.max(requiredOffset, defaultOffset), maxOffset);

  return {
    cardsPerRow,
    overlapOffsetPx: Math.round(overlapOffset) * -1,
    rowCount,
  };
}
