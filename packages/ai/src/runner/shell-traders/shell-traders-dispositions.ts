import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerShellTradersPipelineSignal } from "./shell-traders-types";
export function runnerShellTradersActionDispositions(
  signals: readonly RunnerShellTradersPipelineSignal[],
): PlanActionDisposition[] {
  const dispositions: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) =>
    dispositions.push({
      actionId,
      ownerModuleId,
      evidenceCode,
      disposition: "explicitly_nonproductive",
    });
  for (const signal of signals) {
    for (const actionId of signal.rejectedActionIds ?? []) {
      add(
        actionId,
        "runner.shell_traders_pipeline",
        signal.evidenceCodes.find(
          (evidenceCode) =>
            evidenceCode.includes("rejected") || evidenceCode.includes("holds"),
        ) ?? "runner_shell_traders_pipeline_action_held",
      );
    }
  }
  return dispositions;
}
