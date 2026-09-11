import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerCreditBankSignal } from "./credit-bank-types";

export function runnerCreditBankActionDispositions(
  signals: readonly RunnerCreditBankSignal[],
  otherEconomyActionIds: readonly string[],
): PlanActionDisposition[] {
  const activeNonBankEconomyActionIds = new Set(otherEconomyActionIds);
  const dispositions: PlanActionDisposition[] = [];
  for (const signal of signals) {
    if ((signal.rejectedActionIds?.length ?? 0) === 0) continue;
    for (const actionId of signal.rejectedActionIds ?? []) {
      if (activeNonBankEconomyActionIds.has(actionId)) continue;
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
