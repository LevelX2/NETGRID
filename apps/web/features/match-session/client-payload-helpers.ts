import type { ApiSidePayload } from "@netgrid/shared";

export function effectiveAiTurnPresentation(payload: ApiSidePayload | null): ApiSidePayload["aiTurnPresentation"] | undefined {
  const presentation = payload?.aiTurnPresentation;
  if (!payload || !presentation?.activeAiSide) return presentation;
  const aiHasCurrentControl =
    payload.playerView.activeSide === presentation.activeAiSide ||
    payload.playerView.pendingChoice?.side === presentation.activeAiSide ||
    payload.playerClock?.decisionOwnerSide === presentation.activeAiSide;
  if (aiHasCurrentControl) return presentation;
  return { ...presentation, canAdvanceAi: false };
}

export function removePendingUndo<T extends { pendingUndo?: unknown }>(payload: T): Omit<T, "pendingUndo"> {
  const { pendingUndo: _pendingUndo, ...withoutPendingUndo } = payload;
  return withoutPendingUndo;
}
