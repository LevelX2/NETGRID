import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerShellTradersPipelineSignal } from "./shell-traders-types";
const COVERAGE_REPLACEMENT =
  "runner_shell_traders_dominates_current_coverage_install";

export function runnerShellTradersActionDispositions(
  signals: readonly RunnerShellTradersPipelineSignal[],
): PlanActionDisposition[] {
  const evidenceByAction = new Map<string, string>();
  for (const signal of signals) {
    if (signal.phase === "progress") {
      for (const actionId of signal.coverageSubstitution
        ?.replacedInstallActionIds ?? []) {
        evidenceByAction.set(actionId, COVERAGE_REPLACEMENT);
      }
    }
    for (const { actionId, evidenceCode } of signal.rejectedActions ?? []) {
      const previous = evidenceByAction.get(actionId);
      if (
        previous === undefined ||
        (previous !== COVERAGE_REPLACEMENT && evidenceCode < previous)
      ) {
        evidenceByAction.set(actionId, evidenceCode);
      }
    }
  }
  return [...evidenceByAction].map(([actionId, evidenceCode]) => ({
    actionId,
    ownerModuleId: "runner.shell_traders_pipeline",
    evidenceCode,
    disposition: "explicitly_nonproductive",
  }));
}
