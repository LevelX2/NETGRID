import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerCreditBankSignal } from "./credit-bank-types";

export function runnerCreditBankActionDispositions(
  signals: readonly RunnerCreditBankSignal[],
  otherEconomyActionIds: readonly string[],
): PlanActionDisposition[] {
  const admittedActionIds = new Set([
    ...otherEconomyActionIds,
    ...signals.flatMap((signal) => signal.actionIds),
  ]);
  const dispositions: PlanActionDisposition[] = [];
  for (const signal of signals) {
    for (const actionId of signal.rejectedActionIds ?? []) {
      if (admittedActionIds.has(actionId)) continue;
      admittedActionIds.add(actionId);
      dispositions.push({
        actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.credit_bank",
        evidenceCode:
          signal.evidenceCodes[0] ??
          `runner_credit_bank_${signal.phase}_alternative_deferred`,
      });
    }
  }
  return dispositions;
}
