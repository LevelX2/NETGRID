import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetTacticalPlanMemory } from "../../plans/plan-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import {
  getStrategicIntentMemorySnapshot,
  type StrategicIntentMemorySnapshot,
} from "../../strategic-intent-memory";
import {
  type AiDecisionCheckpointActionMatcher,
  type AiDecisionCheckpointExpectationV1,
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
  strategicIntent?: StrategicIntentMemorySnapshot;
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
  const strategicIntent = getStrategicIntentMemorySnapshot(
    input,
    fixture.deckSnapshot.deckSnapshotId,
  );
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
      ...(strategicIntent ? { strategicIntent } : {}),
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
  const choiceAccepted = choiceExpectationMatches(
    input,
    decision,
    fixture.expectation.choice,
  );
  const strategicIntentAccepted = strategicIntentExpectationMatches(
    strategicIntent,
    fixture.expectation.strategicIntent,
  );
  const decisionChainAccepted = decisionChainExpectationMatches(
    input,
    decision,
    fixture.expectation.decisionChain,
  );
  if (
    forbidden ||
    !accepted ||
    !choiceAccepted ||
    !discardChoiceAccepted ||
    !strategicIntentAccepted ||
    !decisionChainAccepted
  ) {
    return {
      ok: false,
      code: "behavior_regression",
      message: `Behavior expectation failed for ${selectedAction.actionId}`,
      input,
      decision,
      selectedAction,
      ...(strategicIntent ? { strategicIntent } : {}),
    };
  }
  return {
    ok: true,
    message: `Checkpoint passed with ${selectedAction.actionId}`,
    input,
    decision,
    selectedAction,
    ...(strategicIntent ? { strategicIntent } : {}),
  };
}

function decisionChainExpectationMatches(
  input: AiDecisionInput,
  decision: AiDecision,
  expectation: AiDecisionCheckpointExpectationV1["decisionChain"] | undefined,
): boolean {
  if (!expectation) return true;
  const chain = decision.decisionDebug?.decisionChain;
  if (!chain) return false;
  if (
    expectation.selectionRoute !== undefined &&
    chain.initialSelection.route !== expectation.selectionRoute
  ) {
    return false;
  }
  if (expectation.rawScoreWinner) {
    const rawScoreWinner = input.legalActions.find(
      (action) => action.actionId === chain.rawScoreWinner?.actionId,
    );
    if (
      !rawScoreWinner ||
      !actionMatches(input, rawScoreWinner, expectation.rawScoreWinner)
    ) {
      return false;
    }
  }
  if (expectation.planMappedAction) {
    const mappedActions = new Set(chain.planSelection?.mappedActionIds ?? []);
    if (
      !input.legalActions.some(
        (action) =>
          mappedActions.has(action.actionId) &&
          actionMatches(input, action, expectation.planMappedAction!),
      )
    ) {
      return false;
    }
  }
  if (
    expectation.arbitrationOutcome !== undefined &&
    chain.planArbitration?.outcome !== expectation.arbitrationOutcome
  ) {
    return false;
  }
  const adjustmentKinds = new Set(
    chain.adjustments.map((adjustment) => adjustment.kind),
  );
  return (expectation.requiredAdjustmentKinds ?? []).every((kind) =>
    adjustmentKinds.has(kind),
  );
}

function choiceExpectationMatches(
  input: AiDecisionInput,
  decision: AiDecision,
  expectation: AiDecisionCheckpointExpectationV1["choice"] | undefined,
): boolean {
  if (!expectation) return true;
  const choice = input.playerView.pendingChoice;
  if (!choice) return false;
  const rawSelectedIds = decision.selectedChoices?.selectedOptionIds;
  const selectedIds = new Set(
    Array.isArray(rawSelectedIds)
      ? rawSelectedIds.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
  );
  const selectedValues = choice.options
    .filter((option) => selectedIds.has(option.id))
    .flatMap((option) => (option.value === undefined ? [] : [option.value]));
  return (
    (expectation.mustSelectOptionIds ?? []).every((optionId) =>
      selectedIds.has(optionId),
    ) &&
    !(expectation.mustNotSelectOptionIds ?? []).some((optionId) =>
      selectedIds.has(optionId),
    ) &&
    (expectation.mustSelectValues ?? []).every((value) =>
      selectedValues.includes(value),
    ) &&
    !(expectation.mustNotSelectValues ?? []).some((value) =>
      selectedValues.includes(value),
    )
  );
}

function strategicIntentExpectationMatches(
  actual: StrategicIntentMemorySnapshot | undefined,
  expectation: AiDecisionCheckpointExpectationV1["strategicIntent"] | undefined,
): boolean {
  if (!expectation) return true;
  if (!actual) return false;
  const strategyId = actual.primaryStrategyId;
  const family = actual.state.primaryStrategy.family;
  const targetKind = actual.state.targetVector.kind;
  return (
    (!expectation.acceptablePrimaryStrategyIds?.length ||
      expectation.acceptablePrimaryStrategyIds.includes(strategyId)) &&
    !expectation.forbiddenPrimaryStrategyIds?.includes(strategyId) &&
    (!expectation.acceptableFamilies?.length ||
      expectation.acceptableFamilies.includes(family)) &&
    !expectation.forbiddenTargetKinds?.includes(targetKind)
  );
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
      ? rawSelectedIds.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
  );
  if (!choice || choice.source !== "discard_phase") return false;
  const definitionIdByInstanceId = new Map(
    input.playerView.own.gripOrHq.map((card) => [
      card.instanceId,
      card.definitionId,
    ]),
  );
  const discardedDefinitionIds = choice.options
    .filter((option) => selectedIds.has(option.id))
    .map(
      (option) =>
        option.card?.definitionId ??
        definitionIdByInstanceId.get(
          option.card?.instanceId ??
            (typeof option.value === "string" ? option.value : ""),
        ),
    )
    .filter((definitionId): definitionId is string => Boolean(definitionId));
  const discardedInstanceIds = new Set(
    choice.options
      .filter((option) => selectedIds.has(option.id))
      .map(
        (option) =>
          option.card?.instanceId ??
          (typeof option.value === "string" ? option.value : undefined),
      )
      .filter((instanceId): instanceId is string => Boolean(instanceId)),
  );
  const retainedDefinitionIds = input.playerView.own.gripOrHq
    .filter((card) => !discardedInstanceIds.has(card.instanceId))
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
      ...input.playerView.own.scoreArea,
      ...input.playerView.servers.flatMap((server) => [
        ...server.ice,
        ...server.root,
      ]),
    ].find((card) => card.instanceId === sourceId);
    if (source?.definitionId !== matcher.sourceDefinitionId) return false;
  }
  return true;
}
