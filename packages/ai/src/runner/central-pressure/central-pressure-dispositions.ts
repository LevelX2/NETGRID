import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { PlanActionDisposition } from "../../plans/plan-scheduler";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import type { RunnerPressureSignal } from "../../plans/runner-tactical-plan-contracts";
import { runnerUnboundCentralDirectRunDispositionEvidence } from "./central-pressure-signals";

export function runnerCentralRunDispositions(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  runTargets: readonly RunnerRunTargetEvaluation[];
  signals: readonly RunnerPressureSignal[];
  forgoUnsafeRunCapacity: boolean;
  independentlyOwnedActionIds: ReadonlySet<string>;
  existingDispositions: readonly PlanActionDisposition[];
}): PlanActionDisposition[] {
  const {
    input,
    candidates,
    runTargets,
    signals,
    forgoUnsafeRunCapacity,
    independentlyOwnedActionIds,
  } = params;
  const dispositions = [...params.existingDispositions];
  const result: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => {
    const disposition: PlanActionDisposition = {
      actionId,
      ownerModuleId,
      evidenceCode,
      disposition: "explicitly_nonproductive",
    };
    result.push(disposition);
    dispositions.push(disposition);
  };
  for (const evaluation of runTargets) {
    if (
      forgoUnsafeRunCapacity ||
      dispositions.some((entry) => entry.actionId === evaluation.actionId) ||
      independentlyOwnedActionIds.has(evaluation.actionId)
    ) {
      continue;
    }
    if (
      evaluation.targetServerId === "hq" ||
      evaluation.targetServerId === "rd" ||
      evaluation.targetServerId === "archives"
    ) {
      const matchingSignals = signals.filter(
        (signal) => signal.serverId === evaluation.targetServerId,
      );
      const executableRoute = matchingSignals.some(
        (signal) =>
          signal.routePreparation === undefined &&
          signal.reachable &&
          signal.marginalValue > 0 &&
          signal.runActionIds?.includes(evaluation.actionId) === true,
      );
      if (executableRoute) continue;
      const boundSignal = matchingSignals.find(
        (signal) =>
          signal.runActionIds?.includes(evaluation.actionId) === true ||
          signal.runActionExclusions?.[evaluation.actionId] !== undefined ||
          (signal.preparationActionIds?.length ?? 0) > 0,
      );
      if (!boundSignal) {
        const exactDirectRunDisposition =
          runnerUnboundCentralDirectRunDispositionEvidence(
            input,
            candidates,
            evaluation,
          );
        if (exactDirectRunDisposition) {
          add(
            evaluation.actionId,
            "runner.pressure_central",
            exactDirectRunDisposition,
          );
        }
        continue;
      }
      add(
        evaluation.actionId,
        "runner.pressure_central",
        boundSignal.runActionExclusions?.[evaluation.actionId]?.[0] ??
          ((boundSignal.preparationActionIds?.length ?? 0) > 0
            ? `runner_central_run_deferred_to_bound_preparation:${evaluation.targetServerId}`
            : boundSignal.evidenceCode),
      );
      continue;
    }
  }
  return result;
}
