import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";
import { quoteCorpPunishRoute } from "@netgrid/engine";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetTacticalPlanMemory } from "../../plans/plan-memory";
import {
  evaluateRunnerRunTargets,
  type RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import {
  getStrategicIntentMemorySnapshot,
  type StrategicIntentMemorySnapshot,
} from "../../strategic-intent-memory";
import {
  type AiDecisionCheckpointActionMatcher,
  type AiDecisionCheckpointExpectationV1,
  type AiDecisionCheckpointErrorCode,
  type AiDecisionCheckpointRunTargetExpectation,
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
    decisionId: `${fixture.source.decisionScopeId ?? state.matchId}:${state.stateVersion}:${fixture.actor}`,
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
  const decision = chooseAiAction(input, {
    quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
  });
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
  const selectedScoreBreakdownAccepted =
    selectedScoreBreakdownExpectationMatches(
      decision,
      fixture.expectation.selectedScoreBreakdown,
    );
  const planExecutionAccepted = planExecutionExpectationMatches(
    decision,
    fixture.expectation.planExecution,
  );
  const decisionChainAccepted = decisionChainExpectationMatches(
    input,
    decision,
    fixture.expectation.decisionChain,
  );
  const runTargetsAccepted = runTargetExpectationsMatch(
    input,
    fixture.expectation.runTargets,
  );
  const failedExpectations = [
    ...(forbidden ? ["forbidden_action"] : []),
    ...(!accepted ? ["acceptable_action"] : []),
    ...(!choiceAccepted ? ["choice"] : []),
    ...(!discardChoiceAccepted ? ["discard_choice"] : []),
    ...(!strategicIntentAccepted ? ["strategic_intent"] : []),
    ...(!selectedScoreBreakdownAccepted ? ["selected_score_breakdown"] : []),
    ...(!planExecutionAccepted ? ["plan_execution"] : []),
    ...(!runTargetsAccepted ? ["run_targets"] : []),
    ...(!decisionChainAccepted ? ["decision_chain"] : []),
  ];
  if (failedExpectations.length > 0) {
    const planCapabilities = (decision.evidence ?? [])
      .filter((item) => item.startsWith("plan_step_capability:"))
      .map((item) => item.slice("plan_step_capability:".length));
    const planAssessmentEvidence = (decision.evidence ?? [])
      .filter((item) => item.startsWith("plan_assessment_evidence:"))
      .map((item) => item.slice("plan_assessment_evidence:".length));
    const runTargetSummary =
      input.side === "runner"
        ? evaluateRunnerRunTargets({ input }).map((target) => ({
            actionId: target.actionId,
            serverId: target.targetServerId,
            recommendation: target.recommendation,
            path: target.pathPassability,
            pathCost: target.pathCost,
            creditsAfterRun: target.creditsAfterRun,
            score: target.score,
            payoff: target.accessPayoff,
            knownAccessState: target.knownAccessState,
            evidence: target.evidence.filter(
              (item) =>
                item.startsWith("run_") ||
                item.startsWith("visible_") ||
                item.startsWith("known_") ||
                item.startsWith("remote_") ||
                item.startsWith("central_"),
            ),
          }))
        : [];
    return {
      ok: false,
      code: "behavior_regression",
      message: [
        `Behavior expectation failed for ${selectedAction.actionId}: ${failedExpectations.join(",")}`,
        `plan=${decision.decisionDebug?.planKind ?? "none"}`,
        `capabilities=${planCapabilities.join("|") || "none"}`,
        `assessment=${planAssessmentEvidence.join("|") || "none"}`,
        `runTargets=${JSON.stringify(runTargetSummary)}`,
      ].join("; "),
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

function planExecutionExpectationMatches(
  decision: AiDecision,
  expectation: AiDecisionCheckpointExpectationV1["planExecution"] | undefined,
): boolean {
  if (!expectation) return true;
  const planId = decision.decisionDebug?.planId;
  const planKind = decision.decisionDebug?.planKind;
  const evidence = decision.evidence ?? [];
  const capabilities = evidence
    .filter((item) => item.startsWith("plan_step_capability:"))
    .map((item) => item.slice("plan_step_capability:".length));
  const assessmentEvidence = evidence
    .filter((item) => item.startsWith("plan_assessment_evidence:"))
    .map((item) => item.slice("plan_assessment_evidence:".length));
  return (
    (!expectation.acceptablePlanIds?.length ||
      (planId !== undefined &&
        expectation.acceptablePlanIds.includes(planId))) &&
    !(planId !== undefined && expectation.forbiddenPlanIds?.includes(planId)) &&
    (!expectation.acceptablePlanKinds?.length ||
      (planKind !== undefined &&
        expectation.acceptablePlanKinds.includes(planKind))) &&
    !(
      planKind !== undefined &&
      expectation.forbiddenPlanKinds?.includes(planKind)
    ) &&
    (!expectation.acceptableCapabilities?.length ||
      expectation.acceptableCapabilities.some((capability) =>
        capabilities.includes(capability),
      )) &&
    !(expectation.forbiddenCapabilities ?? []).some((capability) =>
      capabilities.includes(capability),
    ) &&
    (expectation.requiredAssessmentEvidence ?? []).every((item) =>
      assessmentEvidence.includes(item),
    ) &&
    !(expectation.forbiddenAssessmentEvidence ?? []).some((item) =>
      assessmentEvidence.includes(item),
    )
  );
}

function runTargetExpectationsMatch(
  input: AiDecisionInput,
  expectations: AiDecisionCheckpointRunTargetExpectation[] | undefined,
): boolean {
  if (!expectations?.length) return true;
  if (input.side !== "runner") return false;
  const evaluations = evaluateRunnerRunTargets({ input });
  return expectations.every((expectation) =>
    evaluations.some((evaluation) =>
      runTargetExpectationMatches(evaluation, expectation),
    ),
  );
}

function runTargetExpectationMatches(
  evaluation: RunnerRunTargetEvaluation,
  expectation: AiDecisionCheckpointRunTargetExpectation,
): boolean {
  return (
    (expectation.actionId === undefined ||
      evaluation.actionId === expectation.actionId) &&
    (expectation.targetServerId === undefined ||
      evaluation.targetServerId === expectation.targetServerId) &&
    (expectation.pathPassability === undefined ||
      evaluation.pathPassability === expectation.pathPassability) &&
    (expectation.pathCost === undefined ||
      evaluation.pathCost === expectation.pathCost) &&
    (expectation.creditsAfterRun === undefined ||
      evaluation.creditsAfterRun === expectation.creditsAfterRun) &&
    (expectation.recommendation === undefined ||
      evaluation.recommendation === expectation.recommendation) &&
    (expectation.requiredEvidence ?? []).every((item) =>
      evaluation.evidence.includes(item),
    ) &&
    !(expectation.forbiddenEvidence ?? []).some((item) =>
      evaluation.evidence.includes(item),
    )
  );
}

function selectedScoreBreakdownExpectationMatches(
  decision: AiDecision,
  expectation:
    | AiDecisionCheckpointExpectationV1["selectedScoreBreakdown"]
    | undefined,
): boolean {
  if (!expectation) return true;
  const componentKeys = new Set(
    decision.decisionDebug?.scoreBreakdown?.map((component) => component.key) ??
      [],
  );
  return (
    (expectation.requiredComponentKeys ?? []).every((key) =>
      componentKeys.has(key),
    ) &&
    !(expectation.forbiddenComponentKeys ?? []).some((key) =>
      componentKeys.has(key),
    )
  );
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
  const selectedOptionIds = Array.isArray(rawSelectedIds)
    ? rawSelectedIds.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const selectedIds = new Set(selectedOptionIds);
  const selectedOptionIdsPrefix = expectation.selectedOptionIdsPrefix ?? [];
  const prefixMatches = selectedOptionIdsPrefix.every(
    (optionId, index) => selectedOptionIds[index] === optionId,
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
    prefixMatches &&
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
    (action.payload?.serverId ??
      action.payload?.selectedServerId ??
      action.payload?.targetServerId) !== matcher.targetServerId
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
