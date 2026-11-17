import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { PlanModuleId } from "./plan-kernel-types";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import type { PlanRoute, PlanRouteCandidate } from "./plan-route";

export type PlanActionDisposition = {
  actionId: string;
  disposition: "explicitly_nonproductive" | "assessment_unknown";
  ownerModuleId: PlanModuleId;
  evidenceCode: string;
};

export function isStandardEndTurnCandidate(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    candidate.actionType === "end_turn" &&
    candidate.semanticActionType === "turn_flow.end_turn" &&
    candidate.sourceKind === "game_rule"
  );
}

export type PlanEarlyEndTurnJustification =
  | {
      kind: "rules_proven_terminal_win";
      terminalCondition: "corp_empty_rd_mandatory_draw";
    }
  | {
      kind: "forgo_restricted_capacity";
      capacityKind: "zero_click_non_basic_run_only";
      explicitlyNonproductiveActionIds: string[];
    }
  | {
      kind: "forgo_exhausted_runner_capacity";
      capacityKind: "empty_stack_all_voluntary_routes_rejected";
      explicitlyNonproductiveActionIds: string[];
    }
  | {
      kind: "forgo_terminal_deck_pressure_capacity";
      capacityKind: "match_point_favorable_deck_race_all_voluntary_routes_rejected";
      explicitlyNonproductiveActionIds: string[];
    };

export function assertEarlyEndTurnRoute(
  context: {
    input: AiDecisionInput;
    actionCandidates: readonly ActionSemanticCandidate[];
    actionDispositions?: readonly PlanActionDisposition[];
  },
  route: PlanRoute,
  materialized: {
    candidates: readonly PlanRouteCandidate[];
    earlyEndTurnJustification?: PlanEarlyEndTurnJustification;
  },
  moduleId: PlanModuleId,
): void {
  const selectedCandidate = materialized.candidates.find(
    (entry) => entry.candidate.actionId === route.head.actionId,
  )?.candidate;
  if (
    !selectedCandidate ||
    !isStandardEndTurnCandidate(selectedCandidate) ||
    context.input.playerView.own.clicks <= 0
  ) {
    return;
  }

  const justification = materialized.earlyEndTurnJustification;
  const terminalWinProven =
    justification?.kind === "rules_proven_terminal_win" &&
    justification.terminalCondition === "corp_empty_rd_mandatory_draw" &&
    context.input.side === "runner" &&
    moduleId === "runner.secure_terminal_win" &&
    context.input.playerView.opponent.deckCount === 0;
  if (terminalWinProven) return;

  const remainingCandidates = context.actionCandidates.filter(
    (candidate) => !isStandardEndTurnCandidate(candidate),
  );
  const remainingActionIds = sortedUnique(
    remainingCandidates.map((candidate) => candidate.actionId),
  );
  const forgoProofActionIds =
    justification?.kind === "forgo_restricted_capacity"
      ? sortedUnique(justification.explicitlyNonproductiveActionIds)
      : [];
  const exactRestrictedActionSet =
    remainingActionIds.length > 0 &&
    sameStrings(remainingActionIds, forgoProofActionIds);
  const everyRemainingActionIsRestrictedRun =
    exactRestrictedActionSet &&
    remainingCandidates.every((candidate) => {
      const legalAction = context.input.legalActions.find(
        (action) => action.actionId === candidate.actionId,
      );
      return (
        candidate.semanticActionType === "run.start" &&
        candidate.actionType === "start_run" &&
        candidate.sourceKind !== "basic_action" &&
        legalAction?.type === "start_run" &&
        legalAction.source !== "basic_action" &&
        legalAction.costs.reduce(
          (total, cost) => total + Math.max(0, cost.clicks ?? 0),
          0,
        ) === 0
      );
    });
  const everyRestrictedRunIsExplicitlyNonproductive =
    everyRemainingActionIsRestrictedRun &&
    remainingActionIds.every((actionId) =>
      (context.actionDispositions ?? []).some(
        (entry) =>
          entry.actionId === actionId &&
          entry.disposition === "explicitly_nonproductive" &&
          entry.ownerModuleId === moduleId,
      ),
    );
  const restrictedCapacityForgoProven =
    justification?.kind === "forgo_restricted_capacity" &&
    justification.capacityKind === "zero_click_non_basic_run_only" &&
    context.input.side === "runner" &&
    moduleId === "runner.defense_and_recovery" &&
    everyRestrictedRunIsExplicitlyNonproductive;
  if (restrictedCapacityForgoProven) return;

  const exhaustedProofActionIds =
    justification?.kind === "forgo_exhausted_runner_capacity"
      ? sortedUnique(justification.explicitlyNonproductiveActionIds)
      : [];
  const exactExhaustedActionSet = sameStrings(
    remainingActionIds,
    exhaustedProofActionIds,
  );
  const exhaustedRunnerCapacityForgoProven =
    justification?.kind === "forgo_exhausted_runner_capacity" &&
    justification.capacityKind ===
      "empty_stack_all_voluntary_routes_rejected" &&
    context.input.side === "runner" &&
    moduleId === "runner.defense_and_recovery" &&
    context.input.playerView.own.stackOrRdCount === 0 &&
    remainingActionIds.length > 0 &&
    exactExhaustedActionSet &&
    remainingActionIds.every((actionId) =>
      (context.actionDispositions ?? []).some(
        (entry) =>
          entry.actionId === actionId &&
          entry.disposition === "explicitly_nonproductive",
      ),
    );
  if (exhaustedRunnerCapacityForgoProven) return;

  const terminalDeckPressureProofActionIds =
    justification?.kind === "forgo_terminal_deck_pressure_capacity"
      ? sortedUnique(justification.explicitlyNonproductiveActionIds)
      : [];
  const exactTerminalDeckPressureActionSet = sameStrings(
    remainingActionIds,
    terminalDeckPressureProofActionIds,
  );
  const terminalDeckPressureForgoProven =
    justification?.kind === "forgo_terminal_deck_pressure_capacity" &&
    justification.capacityKind ===
      "match_point_favorable_deck_race_all_voluntary_routes_rejected" &&
    context.input.side === "runner" &&
    moduleId === "runner.defense_and_recovery" &&
    context.input.playerView.own.agendaPoints >=
      context.input.playerView.agendaPointsToWin - 1 &&
    context.input.playerView.opponent.deckCount > 0 &&
    context.input.playerView.opponent.deckCount <=
      context.input.playerView.own.stackOrRdCount &&
    remainingActionIds.length > 0 &&
    exactTerminalDeckPressureActionSet &&
    remainingActionIds.every((actionId) =>
      (context.actionDispositions ?? []).some(
        (entry) =>
          entry.actionId === actionId &&
          entry.disposition === "explicitly_nonproductive",
      ),
    );
  if (terminalDeckPressureForgoProven) return;

  throw new PlanResolutionFailure("end_turn_with_usable_capacity", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    unresolvedActionIds: remainingActionIds,
    owner: "rules_contract",
    removalCondition:
      "Bind early standard EndTurn to a structurally proven terminal win, an exact restricted-capacity forgo, an empty-Stack Runner turn whose voluntary routes were all owner-rejected, or an exact match-point deck-pressure wait with a favorable deck race and no owner-accepted route. Normal click capacity must otherwise be converted by a productive plan route.",
    planInstanceId: route.planInstanceId,
    stepId: route.step.stepId,
    candidateCount: materialized.candidates.length,
  });
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function sameStrings(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
