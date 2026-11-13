import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunWindowSignal } from "../../plans/runner-tactical-plan-contracts";
import type { RunnerDefenseSignals } from "./defense-types";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import { runnerRunHasExactUrgency } from "../../run-analysis/runner-plan-run-funding";
import { runnerDrawTaxLiabilityProjection } from "../../runtime/runner-draw-tax-liability-score";
import { runnerDrawProjectionFor } from "../../actions/action-economy-projection";
export function runnerDefenseSupportDispositions(
  defense: RunnerDefenseSignals,
  candidates: readonly ActionSemanticCandidate[],
  optionalProgramTrashInstallDispositionActionIds: ReadonlySet<string>,
): PlanActionDisposition[] {
  const result: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) =>
    result.push({
      actionId,
      ownerModuleId,
      evidenceCode,
      disposition: "explicitly_nonproductive",
    });
  for (const actionId of defense.defenseSupportRejectedInstallActionIds ?? []) {
    if (optionalProgramTrashInstallDispositionActionIds.has(actionId)) {
      continue;
    }
    add(
      actionId,
      "runner.defense_and_recovery",
      "runner_defense_support_install_deferred_no_current_need_or_constraint",
    );
  }
  if ((defense.defenseSupportInstallActionIds?.length ?? 0) > 0) {
    for (const candidate of candidates) {
      const evidenceCode =
        candidate.semanticActionType === "tag.remove"
          ? "runner_tag_removal_deferred_for_defense_support_install"
          : candidate.semanticActionType === "counter.remove_trace_tag" ||
              candidate.semanticActionType === "counter.remove_runner_hazard"
            ? "runner_persistent_hazard_counter_deferred_for_defense_support_install"
            : undefined;
      if (!evidenceCode) {
        continue;
      }
      add(candidate.actionId, "runner.defense_and_recovery", evidenceCode);
    }
  }
  return result;
}

export function runnerDefenseSafetyDispositions(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  signals: RunnerDefenseSignals;
  runWindows: readonly RunnerRunWindowSignal[];
  runTargets: readonly RunnerRunTargetEvaluation[];
  terminalActionIds: ReadonlySet<string>;
  alreadyClassifiedActionIds: ReadonlySet<string>;
}): PlanActionDisposition[] {
  const {
    input,
    candidates,
    signals,
    runWindows,
    runTargets,
    terminalActionIds,
    alreadyClassifiedActionIds,
  } = params;
  const result: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) =>
    result.push({
      actionId,
      ownerModuleId,
      evidenceCode,
      disposition: "explicitly_nonproductive",
    });
  if (
    signals.optionalRunEnablesNextCorpPunish ||
    signals.nextCorpTurnGripPreservation
  ) {
    for (const candidate of candidates) {
      const id = candidate.actionId;
      if (
        alreadyClassifiedActionIds.has(id) ||
        terminalActionIds.has(id) ||
        signals.defenseSupportInstallActionIds?.includes(id) ||
        runWindows.some(
          (window) =>
            window.actionAssessments?.[id]?.binding ===
            "engine_restricted_run_sequence",
        )
      )
        continue;
      const targets = runTargets.filter((target) => target.actionId === id);
      if (targets.some((target) => runnerRunHasExactUrgency(input, target)))
        continue;
      if (
        signals.optionalRunEnablesNextCorpPunish &&
        targets.some(
          (target) =>
            target.recommendation === "run_if_free" ||
            target.runCommitment === "probe_only" ||
            target.accessPayoff === "known_low_value",
        )
      ) {
        add(
          id,
          "runner.defense_and_recovery",
          "runner_optional_run_would_enable_known_next_corp_turn_flatline",
        );
      } else if (
        signals.nextCorpTurnGripPreservation &&
        signals.nextCorpTurnBufferTarget !== undefined &&
        signals.handSize + handDeltaForVoluntaryAction(input, candidate) <
          signals.nextCorpTurnBufferTarget
      ) {
        add(
          id,
          "runner.defense_and_recovery",
          "runner_last_action_would_lose_next_corp_turn_hand_buffer",
        );
      }
    }
  }
  if (signals.forgoUnsafeRunCapacity) {
    for (const candidate of candidates) {
      if (candidate.semanticActionType !== "run.start") continue;
      if (
        runWindows.some(
          (signal) =>
            signal.actionAssessments?.[candidate.actionId]?.binding ===
            "engine_restricted_run_sequence",
        )
      ) {
        continue;
      }
      add(
        candidate.actionId,
        "runner.defense_and_recovery",
        "runner_restricted_run_capacity_below_required_hand_buffer",
      );
    }
  }
  for (const actionId of signals.confirmedDamageTaxedDrawActionIds ?? []) {
    if (alreadyClassifiedActionIds.has(actionId)) continue;
    add(
      actionId,
      "runner.defense_and_recovery",
      "runner_confirmed_damage_draw_tax_tag_unsafe",
    );
  }
  if (
    signals.activeTags > 0 &&
    (signals.tagClearFundingNeed !== undefined ||
      candidates.some(
        (candidate) => candidate.semanticActionType === "tag.remove",
      ))
  ) {
    for (const candidate of candidates) {
      if (
        candidate.semanticActionType !== "counter.remove_trace_tag" &&
        candidate.semanticActionType !== "counter.remove_runner_hazard"
      ) {
        continue;
      }
      add(
        candidate.actionId,
        "runner.defense_and_recovery",
        "runner_persistent_hazard_counter_deferred_until_active_tag_removed",
      );
    }
  }
  return result;
}

function handDeltaForVoluntaryAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): number {
  const sourceInGrip = input.playerView.own.gripOrHq.some(
    (card) => card.instanceId === candidate.sourceCardInstanceId,
  );
  const handCardSpent =
    sourceInGrip &&
    (candidate.actionType === "install_card" ||
      candidate.actionType === "play_event")
      ? 1
      : 0;
  const projection = candidate.economyProjection;
  const action = input.legalActions.find(
    (legal) => legal.actionId === candidate.actionId,
  );
  const safeDraw =
    projection !== undefined &&
    (candidate.semanticActionType === "draw.card" ||
      projection.timing === "immediate") &&
    projection.reliability === "guaranteed"
      ? ((action && runnerDrawProjectionFor(action)?.projectedNetHandDelta) ??
        projection.netHandDelta + projection.cardsConsumed)
      : 0;
  let selfDamage = 0;
  for (const cost of candidate.costProfile.selfDamage ?? []) {
    if (typeof cost.amount !== "number") return -Infinity;
    selfDamage += cost.amount;
  }
  if (safeDraw <= 0) return -handCardSpent - selfDamage;
  return (
    (action &&
    runnerDrawTaxLiabilityProjection(input, action, candidate)
      .projectedTagsAdded === 0
      ? safeDraw
      : 0) -
    handCardSpent -
    selfDamage
  );
}
