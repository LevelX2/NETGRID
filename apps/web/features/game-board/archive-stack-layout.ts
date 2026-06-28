const ARCHIVES_CARD_BASE_WIDTH = 108;
const ARCHIVES_CARD_BASE_STEP = 50;
const ARCHIVES_CARD_BASE_MIN_STEP = 8;
const ARCHIVES_STACK_GAP = 10;
const ARCHIVES_TOGGLE_COLUMN_WIDTH = 22;

export function archiveCardStepPx({
  availableWidth,
  archiveCardScale,
  faceupItemCount,
  facedownItemCount,
  hasToggleColumn,
}: {
  availableWidth: number;
  archiveCardScale: number;
  faceupItemCount: number;
  facedownItemCount: number;
  hasToggleColumn: boolean;
}): number | null {
  const pileCount =
    (faceupItemCount > 0 ? 1 : 0) + (facedownItemCount > 0 ? 1 : 0);
  const stepCount =
    Math.max(0, faceupItemCount - 1) + Math.max(0, facedownItemCount - 1);
  if (
    !Number.isFinite(availableWidth) ||
    availableWidth <= 0 ||
    pileCount === 0 ||
    stepCount === 0
  )
    return null;

  const cardWidth = ARCHIVES_CARD_BASE_WIDTH * archiveCardScale;
  const defaultStep = ARCHIVES_CARD_BASE_STEP * archiveCardScale;
  const minStep = Math.max(6, ARCHIVES_CARD_BASE_MIN_STEP * archiveCardScale);
  const gapWidth = hasToggleColumn
    ? ARCHIVES_STACK_GAP * 2 + ARCHIVES_TOGGLE_COLUMN_WIDTH
    : Math.max(0, pileCount - 1) * ARCHIVES_STACK_GAP;
  const fixedWidth = pileCount * cardWidth + gapWidth;
  const defaultWidth = fixedWidth + stepCount * defaultStep;
  if (defaultWidth <= availableWidth) return Math.round(defaultStep);

  const compressedStep = Math.floor((availableWidth - fixedWidth) / stepCount);
  return Math.round(Math.max(minStep, Math.min(defaultStep, compressedStep)));
}
