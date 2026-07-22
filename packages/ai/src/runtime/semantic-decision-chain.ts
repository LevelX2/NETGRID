import {
  AI_DECISION_CHAIN_DEBUG_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionChainDebug,
  type AiDecisionInput,
  type AiDecisionSelectionRoute,
} from "@netgrid/shared";

import type { TacticalPlanRuntimeResult } from "../tactical-plans";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeRunOnlyActionAdjustment,
  TacticalPlanMappedChoiceResult,
} from "./semantic-runtime-types";

export type SemanticRuntimeInitialChoiceCandidates = {
  runPlanChoice?: SemanticRuntimeChoice;
  inevitableCorpDeckoutChoice?: SemanticRuntimeChoice;
  reactiveChoice?: SemanticRuntimeChoice;
  selfDamageImmediateWinChoice?: SemanticRuntimeChoice;
  opponentMatchpointContestChoice?: SemanticRuntimeChoice;
  mappedChoice: TacticalPlanMappedChoiceResult;
  bestChoice?: SemanticRuntimeChoice;
};

export type SemanticRuntimeInitialChoiceSelection = {
  route: AiDecisionSelectionRoute;
  choice: SemanticRuntimeChoice;
  priorityCandidates: Array<{
    route: AiDecisionSelectionRoute;
    actionId: string;
  }>;
};

export function selectSemanticRuntimeInitialChoice(
  candidates: SemanticRuntimeInitialChoiceCandidates,
): SemanticRuntimeInitialChoiceSelection | undefined {
  const priorityCandidates = semanticRuntimePriorityCandidates(candidates);
  const selected = priorityCandidates[0];
  if (!selected) return undefined;
  const choice = semanticRuntimeChoiceForRoute(candidates, selected.route);
  if (!choice) return undefined;
  return {
    route: selected.route,
    choice,
    priorityCandidates: priorityCandidates.map(({ route, choice }) => ({
      route,
      actionId: choice.action.actionId,
    })),
  };
}

export function buildSemanticDecisionChainDebug(params: {
  input: AiDecisionInput;
  choices: readonly SemanticRuntimeChoice[];
  bestChoice?: SemanticRuntimeChoice;
  planRuntime: TacticalPlanRuntimeResult;
  mappedChoice: TacticalPlanMappedChoiceResult;
  initialSelection: SemanticRuntimeInitialChoiceSelection;
  runOnlyActionAdjustment: SemanticRuntimeRunOnlyActionAdjustment;
  selectedChoices?: AiDecision["selectedChoices"];
}): AiDecisionChainDebug {
  const planArbitration = semanticDecisionPlanArbitration(params.mappedChoice);
  const initialActionId = params.initialSelection.choice.action.actionId;
  const finalActionId = params.runOnlyActionAdjustment.choice.action.actionId;
  return {
    schemaVersion: AI_DECISION_CHAIN_DEBUG_SCHEMA_VERSION,
    legalActionCount: params.input.legalActions.length,
    legalActionIds: params.input.legalActions.map((action) => action.actionId),
    exclusions: params.choices.flatMap((choice) =>
      choice.exclusion
        ? [{ actionId: choice.action.actionId, key: choice.exclusion.key }]
        : [],
    ),
    ...(params.bestChoice
      ? {
          rawScoreWinner: {
            actionId: params.bestChoice.action.actionId,
            score: params.bestChoice.score,
          },
        }
      : {}),
    ...(params.planRuntime.selectedPlan
      ? {
          planSelection: {
            planId: params.planRuntime.selectedPlan.planId,
            planKind: params.planRuntime.selectedPlan.type,
            mappedActionIds:
              params.planRuntime.selectedMapping?.legalActions.map(
                (action) => action.actionId,
              ) ?? [],
            contributionMode: params.choices.some((choice) =>
              choice.scoreBreakdown.some(
                (component) =>
                  component.key === "action_capacity_plan_conversion",
              ),
            )
              ? "action_capacity_scoring"
              : "diagnostic_only",
          },
        }
      : {}),
    ...(planArbitration ? { planArbitration } : {}),
    priorityCandidates: params.initialSelection.priorityCandidates,
    initialSelection: {
      route: params.initialSelection.route,
      actionId: initialActionId,
    },
    adjustments:
      initialActionId === finalActionId
        ? []
        : [
            {
              kind: "runner_run_only_adjustment",
              fromActionId: initialActionId,
              toActionId: finalActionId,
            },
          ],
    finalSelection: {
      actionId: finalActionId,
      selectedOptionCount: selectedOptionCount(params.selectedChoices),
      ...choiceResolutionDebug(params.input, params.selectedChoices),
    },
  };
}

export function buildSemanticCoverageFallbackDecisionChainDebug(params: {
  input: AiDecisionInput;
  choices: readonly SemanticRuntimeChoice[];
  actionId: string;
  selectedChoices?: AiDecision["selectedChoices"];
}): AiDecisionChainDebug {
  return {
    schemaVersion: AI_DECISION_CHAIN_DEBUG_SCHEMA_VERSION,
    legalActionCount: params.input.legalActions.length,
    legalActionIds: params.input.legalActions.map((action) => action.actionId),
    exclusions: params.choices.flatMap((choice) =>
      choice.exclusion
        ? [{ actionId: choice.action.actionId, key: choice.exclusion.key }]
        : [],
    ),
    priorityCandidates: [],
    initialSelection: {
      route: "semantic_coverage_fallback",
      actionId: params.actionId,
    },
    adjustments: [],
    finalSelection: {
      actionId: params.actionId,
      selectedOptionCount: selectedOptionCount(params.selectedChoices),
      ...choiceResolutionDebug(params.input, params.selectedChoices),
    },
  };
}

function selectedOptionCount(
  selectedChoices: AiDecision["selectedChoices"] | undefined,
): number {
  const selectedOptionIds = selectedChoices?.selectedOptionIds;
  return Array.isArray(selectedOptionIds) ? selectedOptionIds.length : 0;
}

function choiceResolutionDebug(
  input: AiDecisionInput,
  selectedChoices: AiDecision["selectedChoices"] | undefined,
): Pick<AiDecisionChainDebug["finalSelection"], "choiceResolution"> | object {
  if (!selectedChoices) return {};
  const choice = input.playerView.pendingChoice;
  if (!choice) return {};
  return {
    choiceResolution: {
      choiceId: choice.choiceId,
      kind: choice.kind,
      source: choice.source,
      selectedOptionIds: selectedOptionIds(selectedChoices),
    },
  };
}

function selectedOptionIds(
  selectedChoices: NonNullable<AiDecision["selectedChoices"]>,
): string[] {
  const ids = selectedChoices.selectedOptionIds;
  return Array.isArray(ids)
    ? ids.filter((value): value is string => typeof value === "string")
    : [];
}

function semanticRuntimePriorityCandidates(
  candidates: SemanticRuntimeInitialChoiceCandidates,
): Array<{
  route: AiDecisionSelectionRoute;
  choice: SemanticRuntimeChoice;
}> {
  const mappedRoute: AiDecisionSelectionRoute =
    candidates.mappedChoice.outcome === "semantic_choice_selected"
      ? "tactical_plan_override"
      : "tactical_plan_mapping";
  return [
    routeCandidate("runner_run_plan", candidates.runPlanChoice),
    routeCandidate(
      "inevitable_corp_deckout",
      candidates.inevitableCorpDeckoutChoice,
    ),
    routeCandidate("reactive_choice", candidates.reactiveChoice),
    routeCandidate(
      "self_damage_immediate_win",
      candidates.selfDamageImmediateWinChoice,
    ),
    routeCandidate(
      "opponent_matchpoint_contest",
      candidates.opponentMatchpointContestChoice,
    ),
    routeCandidate(mappedRoute, candidates.mappedChoice.choice),
    routeCandidate("semantic_score", candidates.bestChoice),
  ].filter(
    (
      candidate,
    ): candidate is {
      route: AiDecisionSelectionRoute;
      choice: SemanticRuntimeChoice;
    } => Boolean(candidate),
  );
}

function routeCandidate(
  route: AiDecisionSelectionRoute,
  choice: SemanticRuntimeChoice | undefined,
):
  | { route: AiDecisionSelectionRoute; choice: SemanticRuntimeChoice }
  | undefined {
  return choice ? { route, choice } : undefined;
}

function semanticRuntimeChoiceForRoute(
  candidates: SemanticRuntimeInitialChoiceCandidates,
  route: AiDecisionSelectionRoute,
): SemanticRuntimeChoice | undefined {
  switch (route) {
    case "runner_run_plan":
      return candidates.runPlanChoice;
    case "inevitable_corp_deckout":
      return candidates.inevitableCorpDeckoutChoice;
    case "reactive_choice":
      return candidates.reactiveChoice;
    case "self_damage_immediate_win":
      return candidates.selfDamageImmediateWinChoice;
    case "opponent_matchpoint_contest":
      return candidates.opponentMatchpointContestChoice;
    case "tactical_plan_mapping":
    case "tactical_plan_override":
      return candidates.mappedChoice.choice;
    case "semantic_score":
      return candidates.bestChoice;
    case "semantic_coverage_fallback":
      return undefined;
  }
}

function semanticDecisionPlanArbitration(
  mappedChoice: TacticalPlanMappedChoiceResult,
): AiDecisionChainDebug["planArbitration"] | undefined {
  if (
    !mappedChoice.outcome &&
    !mappedChoice.choice &&
    !mappedChoice.overrideChoice &&
    !mappedChoice.overrideBlockedChoice
  ) {
    return undefined;
  }
  const threshold =
    mappedChoice.overrideThreshold === Number.POSITIVE_INFINITY
      ? "absolute"
      : mappedChoice.overrideThreshold;
  return {
    ...(mappedChoice.outcome ? { outcome: mappedChoice.outcome } : {}),
    ...(mappedChoice.choice
      ? { selectedActionId: mappedChoice.choice.action.actionId }
      : {}),
    ...(mappedChoice.overriddenMappedChoice
      ? { mappedActionId: mappedChoice.overriddenMappedChoice.action.actionId }
      : mappedChoice.outcome !== "semantic_choice_selected" &&
          mappedChoice.choice
        ? { mappedActionId: mappedChoice.choice.action.actionId }
        : {}),
    ...(mappedChoice.overrideChoice
      ? { overrideActionId: mappedChoice.overrideChoice.action.actionId }
      : {}),
    ...(mappedChoice.overrideBlockedChoice
      ? {
          overrideBlockedActionId:
            mappedChoice.overrideBlockedChoice.action.actionId,
        }
      : {}),
    ...(mappedChoice.overrideReason
      ? { reason: mappedChoice.overrideReason }
      : mappedChoice.overrideBlockedReason
        ? { reason: mappedChoice.overrideBlockedReason }
        : {}),
    ...(mappedChoice.scoreGap !== undefined
      ? { scoreGap: mappedChoice.scoreGap }
      : {}),
    ...(threshold !== undefined ? { threshold } : {}),
    ...(threshold !== undefined
      ? {
          policy:
            threshold === "absolute" ? "absolute_plan_control" : "score_gap",
        }
      : {}),
  };
}
