import type { AiDecisionInput } from "@netgrid/shared";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import type { RunnerRemoteContestSignal } from "../../plans/runner-tactical-plan-contracts";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";

/** Opening an exclusive payment window has not fulfilled the selected
 * coverage need. Preserve that existing need; never recreate a missing root. */
export function runnerRemoteCoveragePaymentNeed(
  input: AiDecisionInput,
  previous: ResidentPlanPortfolio | undefined,
):
  | { signal: RunnerRemoteContestSignal; coverageGap: RunnerCoverageGapSignal }
  | undefined {
  const pending = previous?.pendingRunnerCostPenaltySupportOrigin;
  if (
    !previous ||
    !pending ||
    previous.side !== "runner" ||
    input.side !== "runner" ||
    previous.stateVersion + 1 !== input.playerView.stateVersion
  )
    return undefined;
  const continuations = input.legalActions.filter(
    (a) => a.payload?.runnerCostPenaltySupportContinuation === true,
  );
  const continuation =
    continuations.length === 1 ? continuations[0] : undefined;
  const windowId = continuation?.payload?.runnerCostPenaltySupportWindowId;
  if (
    !continuation ||
    typeof windowId !== "string" ||
    continuation.actionId !== pending.originalActionId ||
    !input.legalActions.every(
      (a) =>
        a.side === "runner" &&
        a.expiresAtStateVersion === input.playerView.stateVersion &&
        (a === continuation ||
          (a.payload?.costPenaltySupportWindowId === windowId &&
            a.payload.costPenaltySupportOriginalActionId ===
              pending.originalActionId)),
    )
  )
    return undefined;
  if (pending.windowId !== undefined) {
    if (pending.windowId !== windowId) return undefined;
  } else {
    const opening = input.eventTail?.filter(
      (e) =>
        e.stateVersionBefore === previous.stateVersion &&
        e.stateVersionAfter === input.playerView.stateVersion,
    );
    if (
      previous.stateVersion !== pending.selectedAtStateVersion ||
      opening?.length !== 1 ||
      opening[0]!.publicPayload.actor !== "runner" ||
      opening[0]!.publicPayload.runnerCostPenaltySupportWindowOpened !== true ||
      opening[0]!.publicPayload.runnerCostPenaltySupportWindowId !== windowId ||
      opening[0]!.publicPayload.runnerCostPenaltySupportOriginalActionId !==
        pending.originalActionId
    )
      return undefined;
  }
  const parent = previous.instances.find(
    (i) => i.instanceId === pending.rootPlanInstanceId,
  );
  const leaf = previous.instances.find(
    (i) => i.instanceId === pending.executorInstanceId,
  );
  const state = parent?.moduleState as
    | { kind?: string; signal?: RunnerRemoteContestSignal }
    | undefined;
  const signal = state?.signal;
  const coverage = leaf?.moduleState as
    | { kind?: string; gap?: RunnerCoverageGapSignal }
    | undefined;
  if (
    parent?.moduleId !== "runner.contest_remote" ||
    parent.side !== "runner" ||
    state?.kind !== "remote_contest" ||
    !signal?.supportNeedId ||
    !parent.openNeedIds.includes(signal.supportNeedId) ||
    leaf?.moduleId !== "runner.rig_and_coverage" ||
    leaf.side !== "runner" ||
    leaf.parentInstanceId !== parent.instanceId ||
    leaf.parentNeedId !== signal.supportNeedId ||
    coverage?.kind !== "coverage" ||
    coverage.gap?.gapId !== signal.supportNeedId ||
    coverage.gap.requesterPlanInstanceId !== parent.instanceId ||
    coverage.gap.requesterNeedId !== signal.supportNeedId ||
    coverage.gap.requesterModuleId !== "runner.contest_remote" ||
    coverage.gap.targetServerId !== signal.serverId ||
    !input.playerView.servers.some(
      (s) => s.id === signal.serverId && s.root.length > 0,
    )
  )
    return undefined;
  return {
    signal: structuredClone(signal),
    coverageGap: projectCoverageGapForPayment(
      coverage.gap,
      continuation.actionId,
    ),
  };
}

// The current exclusive payment window retains its selected need and head,
// not the previous main phase's alternative offers or rejection diagnoses.
function projectCoverageGapForPayment(
  previous: RunnerCoverageGapSignal,
  originalActionId: string,
): RunnerCoverageGapSignal {
  const gap = structuredClone(previous);
  const bound = (ids: string[]) => ids.filter((id) => id === originalActionId);
  gap.fundingActionIds = bound(gap.fundingActionIds);
  gap.directSearchActionIds = bound(gap.directSearchActionIds);
  gap.searchEngineSetupActionIds = bound(gap.searchEngineSetupActionIds);
  gap.drawForAnswerActionIds = bound(gap.drawForAnswerActionIds);
  if (gap.installActionIds) gap.installActionIds = bound(gap.installActionIds);
  if (gap.preparationActionIds)
    gap.preparationActionIds = bound(gap.preparationActionIds);
  if (gap.memorySupportActionIds)
    gap.memorySupportActionIds = bound(gap.memorySupportActionIds);
  if (gap.rejectedSearchActionIds)
    gap.rejectedSearchActionIds = bound(gap.rejectedSearchActionIds);
  if (gap.programInstallMemoryRejectedActionIds)
    gap.programInstallMemoryRejectedActionIds = bound(
      gap.programInstallMemoryRejectedActionIds,
    );
  if (gap.installActionValues)
    gap.installActionValues = Object.fromEntries(
      Object.entries(gap.installActionValues).filter(
        ([id]) => id === originalActionId,
      ),
    );
  if (gap.directSearchChoiceBindings)
    gap.directSearchChoiceBindings = gap.directSearchChoiceBindings.filter(
      (binding) => binding.actionId === originalActionId,
    );
  // Historical preparation quotes are not current payment authority.
  delete gap.installCreditPreparation;
  delete gap.heapRecoveryPreparation;
  return gap;
}
