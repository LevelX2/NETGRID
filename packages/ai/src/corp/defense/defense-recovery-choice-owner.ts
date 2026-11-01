import type { PlanInstance } from "../../plans/plan-kernel-types";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

export function exactDefenseRecoveryBinding(
  executor: PlanInstance | undefined,
  actionId: string,
  stateVersion: number,
) {
  const state = executor?.moduleState as {
    kind?: unknown;
    signals?: CorpGenericDefenseSignal[];
  } | undefined;
  if (executor?.moduleId !== "corp.defend_servers" || state?.kind !== "defense" ||
    executor.executionState !== "executor") return undefined;
  return state.signals?.find(signal => signal.kind === "generic" &&
    signal.phase === "recover_exposed_agenda" && signal.actionIds?.includes(actionId) &&
    signal.archivesRecovery?.stateVersion === stateVersion)?.archivesRecovery;
}

export function isExactDefenseRecoveryChoiceOwner(
  executor: PlanInstance | undefined,
  origin: ResidentPlanPortfolio["selectedActionOrigin"],
  stateVersion: number,
): boolean {
  if (origin?.immediateChoicePolicy !== "select_bound_corp_archives_cards_to_hq")
    return false;
  const binding = exactDefenseRecoveryBinding(executor,origin.selectedActionId,stateVersion);
  return binding?.sourceCardId === origin.sourceCardInstanceId &&
    origin.selectedArchiveCardInstanceIds.length === 1 &&
    binding.recoveredCardId === origin.selectedArchiveCardInstanceIds[0];
}
