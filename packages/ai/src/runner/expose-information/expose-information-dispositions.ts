import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerExposeInformationSignal } from "./expose-information-types";

export function runnerExposeInformationActionDispositions(
  signals: readonly RunnerExposeInformationSignal[],
): PlanActionDisposition[] {
  const dispositions: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => {
    dispositions.push({
      actionId,
      ownerModuleId,
      evidenceCode,
      disposition: "explicitly_nonproductive",
    });
  };
  for (const signal of signals) {
    for (const rejectedActionId of signal.rejectedActionIds) {
      add(
        rejectedActionId,
        "runner.expose_information",
        signal.phase === "expose_unknown_ice"
          ? "runner_expose_information_decline_rejected_for_unknown_ice"
          : "runner_expose_information_repeat_rejected_for_known_ice",
      );
    }
    if (!signal.admissible) {
      for (const actionId of signal.actionIds ?? [signal.selectedActionId]) {
        add(
          actionId,
          "runner.expose_information",
          "runner_expose_information_deferred_no_unknown_target",
        );
      }
    }
  }
  return dispositions;
}
