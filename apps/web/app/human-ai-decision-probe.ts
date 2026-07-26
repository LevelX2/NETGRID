import type {
  ApiMatchMode,
  ApiSidePayload,
  LegalAction,
  Side,
} from "@netgrid/shared";
import {
  serverDisplayLabel,
  serverTargetIdForAction,
  type ActionContext,
} from "./action-board-ui";
import type { AiDecisionPreview } from "../lib/client-api";

const HUMAN_VS_AI_MODES = new Set<ApiMatchMode>([
  "human_runner_vs_corp_ai",
  "human_corp_vs_runner_ai",
]);

export function humanAiDecisionProbeAvailable(
  session: { side: Side; mode?: ApiMatchMode } | null,
  payload: Pick<
    ApiSidePayload,
    "side" | "playerView" | "legalActions" | "winner"
  > | null,
): boolean {
  return Boolean(
    session &&
    payload &&
    session.mode &&
    HUMAN_VS_AI_MODES.has(session.mode) &&
    session.side === payload.side &&
    payload.playerView.side === session.side &&
    payload.legalActions.length > 0 &&
    !payload.winner,
  );
}

export function humanAiDecisionProbeMatchesPayload(
  preview: AiDecisionPreview,
  session: { matchId: string; side: Side },
  payload: Pick<ApiSidePayload, "matchId" | "matchVersion" | "playerView">,
): boolean {
  return (
    preview.matchId === session.matchId &&
    preview.matchId === payload.matchId &&
    preview.requestedBy === session.side &&
    preview.side === session.side &&
    preview.matchVersion === payload.matchVersion &&
    preview.stateVersion === payload.playerView.stateVersion
  );
}

export function humanAiDecisionProbeActionContext(
  action: LegalAction | undefined,
): ActionContext | null {
  if (!action) return null;
  const serverId = serverTargetIdForAction(action);
  if (serverId) {
    return {
      kind: "server",
      id: serverId,
      label: serverDisplayLabel(serverId),
    };
  }
  const cardId =
    typeof action.payload?.cardId === "string"
      ? action.payload.cardId
      : typeof action.source === "string" &&
          action.source !== "basic_action" &&
          action.source !== "game_rule"
        ? action.source
        : "";
  return cardId
    ? {
        kind: "card",
        id: cardId,
        label: action.label,
      }
    : null;
}

export function humanAiDecisionProbeReportSource(input: {
  matchId: string;
  matchVersion: number;
  stateVersion: number;
  side: Side;
  selectedActionId?: string | undefined;
  selectedActionType?: string | undefined;
  detail: Record<string, unknown>;
}): Record<string, unknown> {
  const selectedChoices =
    input.detail.selectedChoices &&
    typeof input.detail.selectedChoices === "object" &&
    !Array.isArray(input.detail.selectedChoices)
      ? (input.detail.selectedChoices as Record<string, unknown>)
      : undefined;
  const choiceId =
    typeof selectedChoices?.choiceId === "string"
      ? selectedChoices.choiceId
      : undefined;
  const selectedOptionIds = Array.isArray(selectedChoices?.selectedOptionIds)
    ? selectedChoices.selectedOptionIds.filter(
        (optionId): optionId is string => typeof optionId === "string",
      )
    : undefined;
  return {
    matchId: input.matchId,
    matchVersion: input.matchVersion,
    stateVersion: input.stateVersion,
    side: input.side,
    selectedActionId: input.selectedActionId,
    selectedActionType: input.selectedActionType,
    reasonCode:
      typeof input.detail.reasonCode === "string"
        ? input.detail.reasonCode
        : undefined,
    ...(choiceId && selectedOptionIds
      ? { selectedChoices: { choiceId, selectedOptionIds } }
      : {}),
    advisorProfileId:
      typeof input.detail.advisorProfileId === "string"
        ? input.detail.advisorProfileId
        : undefined,
    advisorDifficulty:
      input.detail.advisorDifficulty === "easy" ||
      input.detail.advisorDifficulty === "normal" ||
      input.detail.advisorDifficulty === "hard"
        ? input.detail.advisorDifficulty
        : undefined,
    advisorMode:
      input.detail.advisorMode === "fresh_human_side_takeover"
        ? input.detail.advisorMode
        : undefined,
    fallbackUsed: input.detail.fallbackUsed === true,
    timeoutUsed: input.detail.timeoutUsed === true,
  };
}
