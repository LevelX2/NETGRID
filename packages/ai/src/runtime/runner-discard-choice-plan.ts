import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { AI_HINTS_BY_CARD } from "../ai-hints";
import type { RunnerDiscardChoiceBinding } from "../plans/runner-core-plan-modules";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";
import { selectableChoiceOptions } from "./choice-option";
import { discardOptionInstanceId } from "./discard-choice-option";
import {
  selectedDiscardChoiceOptionIds,
  type DiscardChoiceKeepScore,
} from "./discard-choice-selection";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

type FlatlineRiskLevel = ReturnType<
  typeof runnerDamageThreatAssessment
>["flatlineRisk"]["level"];

const RUNNER_EMERGENCY_DISCARD_KEEP_BONUS = 10_000;

export function runnerDiscardChoicePlanBinding(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  discardKeepScore?: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => DiscardChoiceKeepScore;
}): RunnerDiscardChoiceBinding | undefined {
  const { input } = params;
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "runner" ||
    choice?.kind !== "select_cards" ||
    choice.source !== "discard_phase"
  ) {
    return undefined;
  }
  const resolveAction = input.legalActions.find(
    (action) => action.type === "resolve_choice",
  );
  const exactCandidate = resolveAction
    ? params.candidates.find(
        (candidate) =>
          candidate.actionId === resolveAction.actionId &&
          candidate.semanticActionType === "choice.resolve",
      )
    : undefined;
  const discardKeepScore = params.discardKeepScore;
  if (!resolveAction || !exactCandidate || !discardKeepScore) {
    throw missingRunnerDiscardCoverage(
      input,
      resolveAction?.actionId,
      "Bind the exact Runner discard LegalAction and semantic candidate before the defense plan selects cards.",
    );
  }
  const selectableOptions = selectableChoiceOptions(choice.options);
  const knownHandByInstanceId = new Map(
    input.playerView.own.gripOrHq
      .filter((card) => card.known && card.definitionId)
      .map((card) => [card.instanceId, card]),
  );
  const optionInstanceIds = selectableOptions.map(discardOptionInstanceId);
  if (
    optionInstanceIds.some(
      (instanceId) => !instanceId || !knownHandByInstanceId.has(instanceId),
    )
  ) {
    throw missingRunnerDiscardCoverage(
      input,
      resolveAction.actionId,
      "Bind a Runner discard choice only when every option maps to a known card in the exact current Grip PlayerView.",
    );
  }
  const flatlineRiskLevel =
    runnerDamageThreatAssessment(input).flatlineRisk.level;
  const emergencyKeepCardInstanceIds = optionInstanceIds.filter(
    (instanceId): instanceId is string => {
      const card = instanceId
        ? knownHandByInstanceId.get(instanceId)
        : undefined;
      return card
        ? runnerEmergencyDiscardKeepApplies(flatlineRiskLevel, card)
        : false;
    },
  );
  const emergencyKeepCardInstanceIdSet = new Set(emergencyKeepCardInstanceIds);
  const selectedOptionIds = selectedDiscardChoiceOptionIds(
    input,
    choice,
    selectableOptions,
    (scoringInput, card) => {
      const score = discardKeepScore(scoringInput, card);
      return emergencyKeepCardInstanceIdSet.has(card.instanceId)
        ? {
            ...score,
            total: score.total + RUNNER_EMERGENCY_DISCARD_KEEP_BONUS,
            planDisposition: "current_plan_route",
          }
        : score;
    },
  );
  const selectedOptionIdSet = new Set(selectedOptionIds);
  const discardedCardInstanceIds = selectableOptions
    .filter((option) => selectedOptionIdSet.has(option.id))
    .map(discardOptionInstanceId)
    .filter((instanceId): instanceId is string => instanceId !== undefined);
  const discardedCardInstanceIdSet = new Set(discardedCardInstanceIds);
  return {
    actionId: resolveAction.actionId,
    choiceId: choice.choiceId,
    observedAtStateVersion: input.playerView.stateVersion,
    selectedOptionIds,
    discardedCardInstanceIds,
    retainedCardInstanceIds: optionInstanceIds.filter(
      (instanceId): instanceId is string =>
        instanceId !== undefined && !discardedCardInstanceIdSet.has(instanceId),
    ),
    emergencyKeepCardInstanceIds,
    evidenceCodes: [
      "runner_discard_owned_by_defense_plan",
      "runner_discard_selection_bound_to_current_choice",
      `runner_discard_flatline_risk:${flatlineRiskLevel}`,
      ...(emergencyKeepCardInstanceIds.length > 0
        ? ["runner_discard_emergency_flatline_prevention_keep"]
        : ["runner_discard_ranked_by_generic_keep_value"]),
    ],
  };
}

export function runnerEmergencyDiscardKeepApplies(
  flatlineRiskLevel: FlatlineRiskLevel,
  card: Pick<VisibleCard, "definitionId">,
): boolean {
  if (flatlineRiskLevel !== "confirmed" && flatlineRiskLevel !== "critical") {
    return false;
  }
  const hint = card.definitionId
    ? AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  return Boolean(
    hint?.effects?.some(
      (effect) =>
        effect.kind === "flatline_prevention" &&
        effect.scope === "runner" &&
        effect.target === "flatline" &&
        effect.timing === "prevention_window",
    ),
  );
}

function missingRunnerDiscardCoverage(
  input: AiDecisionInput,
  actionId: string | undefined,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("missing_plan_module_coverage", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    unresolvedActionIds: actionId
      ? [actionId]
      : input.legalActions.map((action) => action.actionId),
    owner: "plan_module",
    planInstanceId: "plan:runner.defense_and_recovery:runner",
    removalCondition,
  });
}
