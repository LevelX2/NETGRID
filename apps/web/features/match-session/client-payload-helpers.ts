import type {
  ApiServerMessage,
  ApiSidePayload,
  PlayerView,
} from "@netgrid/shared";

export function withPlayerView<
  T extends Pick<ApiSidePayload, "playerView" | "legalActions">,
>(payload: T, playerView: PlayerView): T {
  return { ...payload, playerView, legalActions: playerView.legalActions };
}

export function withVersionedLegalActions(
  payload: ApiSidePayload,
  update: Extract<ApiServerMessage, { type: "legal_actions" }>["payload"],
): ApiSidePayload {
  // The PlayerView already carries its actions. A separate delivery must
  // never replace them with actions belonging to another state.
  if (update.stateVersion !== payload.playerView.stateVersion) return payload;
  return withPlayerView(payload, {
    ...payload.playerView,
    legalActions: update.legalActions,
  });
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

export function removePendingUndo<T extends { pendingUndo?: unknown }>(
  payload: T,
): Omit<T, "pendingUndo"> {
  const { pendingUndo: _pendingUndo, ...withoutPendingUndo } = payload;
  return withoutPendingUndo;
}
