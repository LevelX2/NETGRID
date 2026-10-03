import { runnerRunFundingParentHasCurrentNeed } from "../../plans/runner-funding-parent";
import type { RunnerCreditBankSignal } from "./credit-bank-types";

/** Revalidate prospective payouts after the run owner has admitted its actual route. */
export function reconcileRunnerCreditBankRunFunding(
  signals: readonly RunnerCreditBankSignal[],
  stateVersion: number,
  parents: Parameters<typeof runnerRunFundingParentHasCurrentNeed>[0],
): RunnerCreditBankSignal[] {
  return signals.map((signal) => {
    const funding = signal.runFunding;
    if (!funding) return signal;
    const currentState = funding.stateVersion === stateVersion;
    if (currentState && runnerRunFundingParentHasCurrentNeed(parents, funding))
      return signal;
    const { runFunding, ...resident } = signal;
    return {
      ...resident,
      phase: "hold",
      actionIds: [],
      rejectedActionIds: [
        ...new Set([...signal.actionIds, ...(signal.rejectedActionIds ?? [])]),
      ],
      priorityClass: "P5",
      value: 0,
      evidenceCodes: [
        currentState
          ? `runner_credit_bank_run_funding_parent_need_withdrawn:${funding.needId}`
          : `runner_credit_bank_run_funding_state_expired:${funding.stateVersion}`,
        ...signal.evidenceCodes,
      ],
    };
  });
}
