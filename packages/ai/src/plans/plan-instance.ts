import { PlanResolutionFailure } from "./plan-resolution-failure";
import type {
  PlanEvidenceRef,
  PlanInstance,
  PlanInstanceStateIssue,
  PlanProposal,
} from "./plan-kernel-types";

export function planProposalKey(
  proposal: Pick<PlanProposal, "side" | "moduleId" | "dedupeKey">,
): string {
  return `${proposal.side}|${proposal.moduleId}|${normalizedIdentityToken(proposal.dedupeKey)}`;
}

export function planInstanceIdForProposal(
  proposal: Pick<PlanProposal, "moduleId" | "dedupeKey">,
): string {
  return `plan:${proposal.moduleId}:${encodeURIComponent(
    normalizedIdentityToken(proposal.dedupeKey),
  )}`;
}

export function instantiatePlanProposal(
  proposal: PlanProposal,
  stateVersion: number,
): PlanInstance {
  const normalizedVersion = nonNegativeInteger(stateVersion);
  const instance: PlanInstance = {
    instanceId: planInstanceIdForProposal(proposal),
    dedupeKey: normalizedIdentityToken(proposal.dedupeKey),
    moduleId: proposal.moduleId,
    moduleVersion: normalizedIdentityToken(proposal.moduleVersion),
    side: proposal.side,
    strategyLineIds: uniqueSorted(proposal.strategyLineIds),
    executionClass: proposal.executionClass,
    viability: proposal.initialViability,
    portfolioRole: "unassigned",
    executionState: "idle",
    persistencePolicy: proposal.persistencePolicy,
    retentionPolicy: {
      ...proposal.retentionPolicy,
      blockedStateVersionTtl: nonNegativeInteger(
        proposal.retentionPolicy.blockedStateVersionTtl,
      ),
      dormantStateVersionTtl: nonNegativeInteger(
        proposal.retentionPolicy.dormantStateVersionTtl,
      ),
      completedHistoryStateVersionTtl: nonNegativeInteger(
        proposal.retentionPolicy.completedHistoryStateVersionTtl,
      ),
    },
    ...(proposal.target ? { target: { ...proposal.target } } : {}),
    ...(proposal.parentInstanceId
      ? { parentInstanceId: proposal.parentInstanceId }
      : {}),
    ...(proposal.parentNeedId !== undefined
      ? { parentNeedId: proposal.parentNeedId }
      : {}),
    openNeedIds: [],
    phase: proposal.phase,
    milestone: proposal.milestone,
    moduleState: proposal.moduleState,
    blockers: proposal.blockers.map((blocker) => ({ ...blocker })),
    resumeConditions: proposal.resumeConditions.map((condition) => ({
      ...condition,
    })),
    completionConditions: proposal.completionConditions.map((condition) => ({
      ...condition,
    })),
    abandonmentConditions: proposal.abandonmentConditions.map((condition) => ({
      ...condition,
    })),
    resourceClaimIds: [],
    acceptedReservationIds: [],
    ...(proposal.cadence ? { cadence: { ...proposal.cadence } } : {}),
    progress: {
      status: "not_started",
      value: 0,
      milestone: proposal.milestone,
      reasonCode: "plan_instance_created",
    },
    createdAtStateVersion: normalizedVersion,
    updatedAtStateVersion: normalizedVersion,
    evidenceRefs: normalizeEvidenceRefs(proposal.evidenceRefs),
  };
  assertValidPlanInstance(instance);
  return instance;
}

export function deduplicatePlanProposals(
  proposals: readonly PlanProposal[],
  stateVersion: number,
): PlanProposal[] {
  const byKey = new Map<string, PlanProposal>();
  for (const proposal of [...proposals].sort((left, right) =>
    planProposalKey(left).localeCompare(planProposalKey(right)),
  )) {
    const key = planProposalKey(proposal);
    if (byKey.has(key)) {
      throw new PlanResolutionFailure("invalid_plan_identity", {
        side: proposal.side,
        stateVersion,
        timingPoint: "plan_discovery",
        legalActionTypes: [],
        owner: "plan_registry",
        removalCondition:
          "Make the module emit exactly one proposal for each stable dedupe key.",
        planInstanceId: planInstanceIdForProposal(proposal),
      });
    }
    byKey.set(key, proposal);
  }
  return [...byKey.values()];
}

export function planInstanceStateIssues(
  instance: PlanInstance,
): PlanInstanceStateIssue[] {
  const issues: PlanInstanceStateIssue[] = [];
  if (!instance.moduleId.startsWith(`${instance.side}.`)) {
    issues.push("module_side_mismatch");
  }
  if (!instance.dedupeKey.trim()) issues.push("blank_dedupe_key");
  if (!instance.phase.trim()) issues.push("blank_phase");
  if (instance.parentNeedId !== undefined && !instance.parentNeedId.trim()) {
    issues.push("blank_parent_need_id");
  }
  if (
    instance.parentNeedId !== undefined &&
    !instance.parentInstanceId?.trim()
  ) {
    issues.push("parent_need_without_parent");
  }
  if (
    instance.executionState === "executor" &&
    instance.viability !== "ready"
  ) {
    issues.push("non_ready_executor");
  }
  if (
    instance.executionState === "preempted" &&
    instance.viability !== "ready"
  ) {
    issues.push("non_ready_preempted");
  }
  if (isTerminal(instance) && instance.portfolioRole !== "unassigned") {
    issues.push("terminal_plan_assigned");
  }
  if (isTerminal(instance) && instance.openNeedIds.length > 0) {
    issues.push("terminal_plan_has_open_need");
  }
  if (isTerminal(instance) && instance.commitmentId) {
    issues.push("terminal_plan_has_commitment");
  }
  if (instance.viability === "blocked" && instance.blockers.length === 0) {
    issues.push("blocked_plan_without_blocker");
  }
  if (instance.viability === "ready" && instance.blockers.length > 0) {
    issues.push("ready_plan_has_blocker");
  }
  if (
    instance.createdAtStateVersion > instance.updatedAtStateVersion ||
    (instance.lastProductiveAtStateVersion !== undefined &&
      (instance.lastProductiveAtStateVersion < instance.createdAtStateVersion ||
        instance.lastProductiveAtStateVersion > instance.updatedAtStateVersion))
  ) {
    issues.push("invalid_state_version_order");
  }
  return issues;
}

export function assertValidPlanInstance(instance: PlanInstance): void {
  const issues = planInstanceStateIssues(instance);
  if (issues.length === 0) return;
  throw new PlanResolutionFailure("invalid_plan_identity", {
    side: instance.side,
    stateVersion: instance.updatedAtStateVersion,
    timingPoint: "plan_instance_validation",
    legalActionTypes: [],
    owner: "plan_registry",
    removalCondition: `Repair plan instance invariants: ${issues.join(",")}`,
    planInstanceId: instance.instanceId,
  });
}

function isTerminal(instance: PlanInstance): boolean {
  return (
    instance.viability === "completed" || instance.viability === "abandoned"
  );
}

function uniqueSorted(values: readonly string[]): string[] {
  return [
    ...new Set(values.map(normalizedIdentityToken).filter(Boolean)),
  ].sort();
}

function normalizedIdentityToken(value: string): string {
  return value.trim().replace(/\s+/g, "_").slice(0, 160);
}

function nonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeEvidenceRefs(
  evidenceRefs: readonly PlanEvidenceRef[],
): PlanEvidenceRef[] {
  const unique = new Map<string, PlanEvidenceRef>();
  for (const evidence of evidenceRefs) {
    const normalized = {
      code: normalizedIdentityToken(evidence.code),
      source: evidence.source,
    };
    unique.set(`${normalized.source}|${normalized.code}`, normalized);
  }
  return [...unique.values()].sort(
    (left, right) =>
      left.source.localeCompare(right.source) ||
      left.code.localeCompare(right.code),
  );
}
