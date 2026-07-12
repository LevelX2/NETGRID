import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetTacticalPlanMemory } from "../../plans/plan-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import {
  type AiDecisionCheckpointActionMatcher,
  type AiDecisionCheckpointErrorCode,
  type AiDecisionCheckpointV1,
} from "./checkpoint-types";
import { validateAiDecisionCheckpoint } from "./checkpoint-validation";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

export type AiDecisionCheckpointRunResult = {
  ok: boolean;
  code?: AiDecisionCheckpointErrorCode;
  message: string;
  input: AiDecisionInput;
  decision?: AiDecision;
  selectedAction?: LegalAction;
};

export function runAiDecisionCheckpoint(
  uncheckedFixture: AiDecisionCheckpointV1,
): AiDecisionCheckpointRunResult {
  const fixture = validateAiDecisionCheckpoint(uncheckedFixture);
  resetTacticalPlanMemory();
  const state = structuredClone(fixture.engine.testOnlyGameState);
  state.eventLog = fixture.engine.eventPrefix.map((event) => ({ ...event }));
  const options = {
    difficulty: fixture.difficulty,
    profileId: fixture.profileId,
    decisionId: `${state.matchId}:${state.stateVersion}:${fixture.actor}`,
    actionNumber: state.stateVersion,
    ownDeckSnapshot: fixture.deckSnapshot,
    eventTail: fixture.engine.eventPrefix,
  } as const;
  const restoreInput = buildAiDecisionInput(state, fixture.actor, options);
  try {
    restoreAiRuntimeCheckpoint(
      restoreInput,
      fixture.deckSnapshot.deckSnapshotId,
      fixture.runtime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      code: message.startsWith("fixture_migration_required")
        ? "fixture_migration_required"
        : "runtime_state_drift",
      message,
      input: restoreInput,
    };
  }
  const input = buildAiDecisionInput(state, fixture.actor, options);
  const decision = chooseAiAction(input);
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === decision.actionId,
  );
  if (!selectedAction) {
    return {
      ok: false,
      code: "engine_legality_drift",
      message: `Selected action is not legal: ${decision.actionId}`,
      input,
      decision,
    };
  }
  const forbidden = fixture.expectation.forbiddenActions?.some((matcher) =>
    actionMatches(input, selectedAction, matcher),
  );
  const acceptable = fixture.expectation.acceptableActions;
  const accepted =
    !acceptable?.length ||
    acceptable.some((matcher) => actionMatches(input, selectedAction, matcher));
  const discardChoiceAccepted = discardChoiceExpectationMatches(
    input,
    decision,
    fixture.expectation.discardChoice,
  );
  if (forbidden || !accepted || !discardChoiceAccepted) {
    return {
      ok: false,
      code: "behavior_regression",
      message: `Behavior expectation failed for ${selectedAction.actionId}`,
      input,
      decision,
      selectedAction,
    };
  }
  return {
    ok: true,
    message: `Checkpoint passed with ${selectedAction.actionId}`,
    input,
    decision,
    selectedAction,
  };
}

function discardChoiceExpectationMatches(
  input: AiDecisionInput,
  decision: AiDecision,
  expectation:
    | {
        mustRetainDefinitionIds?: string[];
        mustDiscardDefinitionIds?: string[];
      }
    | undefined,
): boolean {
  if (!expectation) return true;
  const choice = input.playerView.pendingChoice;
  const rawSelectedIds = decision.selectedChoices?.selectedOptionIds;
  const selectedIds = new Set(
    Array.isArray(rawSelectedIds)
      ? rawSelectedIds.filter((value): value is string => typeof value === "string")
      : [],
  );
  if (!choice || choice.source !== "discard_phase") return false;
  const discardedDefinitionIds = choice.options
    .filter((option) => selectedIds.has(option.id))
    .map((option) => option.card?.definitionId)
    .filter((definitionId): definitionId is string => Boolean(definitionId));
  const retainedDefinitionIds = input.playerView.own.gripOrHq
    .filter(
      (card) =>
        !choice.options.some(
          (option) =>
            selectedIds.has(option.id) &&
            option.card?.instanceId === card.instanceId,
        ),
    )
    .map((card) => card.definitionId)
    .filter((definitionId): definitionId is string => Boolean(definitionId));
  return (
    (expectation.mustRetainDefinitionIds ?? []).every((definitionId) =>
      retainedDefinitionIds.includes(definitionId),
    ) &&
    (expectation.mustDiscardDefinitionIds ?? []).every((definitionId) =>
      discardedDefinitionIds.includes(definitionId),
    )
  );
}

function actionMatches(
  input: AiDecisionInput,
  action: LegalAction,
  matcher: AiDecisionCheckpointActionMatcher,
): boolean {
  if (matcher.actionId && action.actionId !== matcher.actionId) return false;
  if (matcher.type && action.type !== matcher.type) return false;
  if (
    matcher.targetServerId &&
    action.payload?.serverId !== matcher.targetServerId
  ) {
    return false;
  }
  if (matcher.sourceDefinitionId) {
    const sourceId = action.source ?? String(action.payload?.cardId ?? "");
    const source = [
      ...input.playerView.own.gripOrHq,
      ...(input.playerView.own.rig ?? []),
      ...input.playerView.servers.flatMap((server) => [
        ...server.ice,
        ...server.root,
      ]),
    ].find((card) => card.instanceId === sourceId);
    if (source?.definitionId !== matcher.sourceDefinitionId) return false;
  }
  return true;
}
