import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerRecurringEconomySignal } from "./recurring-economy-types";

export function runnerRecurringEconomyActionDispositions(
  signals: readonly RunnerRecurringEconomySignal[],
  candidates: readonly ActionSemanticCandidate[],
  protectedActionIds: ReadonlySet<string>,
): PlanActionDisposition[] {
  const dispositions: PlanActionDisposition[] = [];
  const recurringEconomyInstallActionIds = new Set(
    signals
      .filter((signal) => signal.phase === "install")
      .flatMap((signal) => signal.actionIds),
  );
  for (const signal of signals) {
    if (signal.phase !== "hold") continue;
    for (const candidate of candidates) {
      if (
        candidate.semanticActionType !== "install.card" ||
        candidate.sourceDefinitionId !== signal.definitionId ||
        recurringEconomyInstallActionIds.has(candidate.actionId) ||
        // A local income deferral cannot reject another exact purpose of
        // the same hardware, such as the coverage owner's MU preparation.
        protectedActionIds.has(candidate.actionId) ||
        dispositions.some(
          (disposition) => disposition.actionId === candidate.actionId,
        )
      ) {
        continue;
      }
      dispositions.push({
        actionId: candidate.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.recurring_economy",
        evidenceCode:
          signal.evidenceCodes[0] ??
          `runner_recurring_economy_install_deferred:${signal.definitionId}`,
      });
    }
  }
  return dispositions;
}
