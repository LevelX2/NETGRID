import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerResourceLifecycleSignal } from "./resource-lifecycle-types";

export function runnerResourceLifecycleActionDispositions(
  signals: readonly RunnerResourceLifecycleSignal[],
): PlanActionDisposition[] {
  const dispositions: PlanActionDisposition[] = [];
  for (const signal of signals) {
    if (signal.phase !== "retain") continue;
    for (const actionId of signal.rejectedActionIds ?? []) {
      dispositions.push({
        actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.resource_lifecycle",
        evidenceCode:
          signal.evidenceCodes[0] ??
          "runner_resource_lifecycle_retain_current_source",
      });
    }
  }
  return dispositions;
}
