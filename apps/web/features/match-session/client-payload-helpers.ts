import type { ApiSidePayload } from "@netgrid/shared";

export function latestSideUpdate(
  current: ApiSidePayload | null,
  next: ApiSidePayload,
): ApiSidePayload {
  return current &&
    current.matchId === next.matchId &&
    current.side === next.side &&
    current.matchVersion > next.matchVersion
    ? current
    : next;
}

export function effectiveAiTurnPresentation(
  payload: ApiSidePayload | null,
): ApiSidePayload["aiTurnPresentation"] | undefined {
  const presentation = payload?.aiTurnPresentation;
  if (!payload || !presentation?.activeAiSide) return presentation;
  const aiHasCurrentControl =
    payload.playerView.activeSide === presentation.activeAiSide ||
    payload.playerView.pendingChoice?.side === presentation.activeAiSide ||
    payload.playerClock?.decisionOwnerSide === presentation.activeAiSide;
  if (aiHasCurrentControl) return presentation;
  return { ...presentation, canAdvanceAi: false };
}
