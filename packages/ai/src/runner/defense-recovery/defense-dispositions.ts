import type { RunnerRunWindowSignal } from "../../plans/runner-tactical-plan-contracts";
import type { RunnerDefenseSignals } from "./defense-types";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { PlanActionDisposition } from "../../plans/plan-scheduler";
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
  candidates: readonly ActionSemanticCandidate[];
  signals: RunnerDefenseSignals;
  runWindows: readonly RunnerRunWindowSignal[];
  alreadyClassifiedActionIds: ReadonlySet<string>;
}): PlanActionDisposition[] {
  const { candidates, signals, runWindows, alreadyClassifiedActionIds } =
    params;
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
