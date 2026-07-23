import type { Side } from "@netgrid/shared";
import type { GuaranteeLevel } from "./plan-assessment";
import type { PlanRouteStep, PlanStepCapability } from "./plan-route";
import { PlanResolutionFailure } from "./plan-resolution-failure";

export type DecisionWindowKind =
  | "automatic_resolution"
  | "mandatory_choice"
  | "optional_ability"
  | "main_action"
  | "run"
  | "access"
  | "trace"
  | "pass_decline";

export type PlanExecutionOrigin = {
  rootPlanInstanceId: string;
  leafPlanInstanceId: string;
  commitmentId?: string;
  side: Side;
  windowKind: DecisionWindowKind;
  windowId: string;
  stateVersion: number;
  timingPoint: string;
};

export type PlanExecutionReceipt = {
  origin: PlanExecutionOrigin;
  actionId: string;
  actionType: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  outcomeCodes: string[];
};

export type CommitmentDeadline = {
  horizon: "current_window" | "current_turn" | "current_run";
  stateVersionLimit?: number;
  turnKey?: string;
  runId?: string;
};

export type CommitmentBranchCondition =
  | "always"
  | "trace_success"
  | "trace_failed"
  | "tag_applied"
  | "tag_prevented"
  | "damage_pending"
  | "damage_prevented"
  | "run_successful"
  | "run_ended"
  | "access_available"
  | "score_window_open"
  | "target_invalidated";

export type CommitmentNode = {
  nodeId: string;
  capability: PlanStepCapability;
  purpose: string;
  windowKind: DecisionWindowKind;
  branches: {
    condition: CommitmentBranchCondition;
    nextNodeId?: string;
    terminal?: "completed" | "aborted";
    reasonCode: string;
  }[];
};

export type PlanCommitment = {
  commitmentId: string;
  rootPlanInstanceId: string;
  leafPlanInstanceId: string;
  side: Side;
  guarantee: GuaranteeLevel;
  deadline: CommitmentDeadline;
  status: "active" | "completed" | "aborted" | "invalidated";
  currentNodeId: string;
  nodes: CommitmentNode[];
  createdAtStateVersion: number;
  materializedAtStateVersion?: number;
};

export type ContinuationObservation = {
  side: Side;
  stateVersion: number;
  timingPoint: string;
  windowKind: DecisionWindowKind;
  windowId: string;
  outcomeCodes: string[];
};

export function createPlanCommitment(
  commitment: PlanCommitment,
): PlanCommitment {
  assertCommitmentGraph(commitment);
  return structuredClone(commitment);
}

export function materializeCommitmentStep(
  commitment: PlanCommitment,
  observation: ContinuationObservation,
): {
  commitment: PlanCommitment;
  origin: PlanExecutionOrigin;
  step?: PlanRouteStep;
  transitionReason: string;
} {
  assertCommitmentGraph(commitment);
  if (
    commitment.status !== "active" ||
    commitment.side !== observation.side ||
    observation.stateVersion < commitment.createdAtStateVersion
  ) {
    throw continuationFailure(
      "commitment_invalidated",
      commitment,
      observation,
      "Continue only an active same-side commitment at a current state.",
    );
  }
  if (deadlineExpired(commitment.deadline, observation)) {
    throw continuationFailure(
      "commitment_invalidated",
      commitment,
      observation,
      "Abort the commitment explicitly when its concrete deadline expires.",
    );
  }
  const node = commitment.nodes.find(
    (candidate) => candidate.nodeId === commitment.currentNodeId,
  );
  if (!node) {
    throw continuationFailure(
      "commitment_invalidated",
      commitment,
      observation,
      "Keep the current node inside the validated semantic graph.",
    );
  }
  const branch = node.branches.find(
    (candidate) =>
      candidate.condition !== "always" &&
      observation.outcomeCodes.includes(candidate.condition),
  );
  const chosen = branch ?? node.branches.find((candidate) => candidate.condition === "always");
  const next = structuredClone(commitment);
  next.materializedAtStateVersion = observation.stateVersion;
  const origin = originFor(commitment, observation);

  if (chosen?.terminal) {
    next.status = chosen.terminal;
    return {
      commitment: next,
      origin,
      transitionReason: chosen.reasonCode,
    };
  }
  if (chosen?.nextNodeId) {
    next.currentNodeId = chosen.nextNodeId;
    const nextNode = next.nodes.find(
      (candidate) => candidate.nodeId === chosen.nextNodeId,
    );
    if (!nextNode) {
      throw continuationFailure(
        "commitment_invalidated",
        commitment,
        observation,
        "Point every branch at a declared semantic node.",
      );
    }
    return {
      commitment: next,
      origin,
      step: {
        stepId: `${commitment.commitmentId}:${nextNode.nodeId}`,
        capability: structuredClone(nextNode.capability),
        purpose: nextNode.purpose,
      },
      transitionReason: chosen.reasonCode,
    };
  }
  if (node.windowKind !== observation.windowKind) {
    throw continuationFailure(
      "window_origin_missing",
      commitment,
      observation,
      "Materialize the commitment only in its declared decision-window kind.",
    );
  }
  return {
    commitment: next,
    origin,
    step: {
      stepId: `${commitment.commitmentId}:${node.nodeId}`,
      capability: structuredClone(node.capability),
      purpose: node.purpose,
    },
    transitionReason: "current_node_materialized",
  };
}

export function requireExecutionOrigin(
  origin: PlanExecutionOrigin | undefined,
  context: {
    side: Side;
    stateVersion: number;
    timingPoint: string;
    windowKind: DecisionWindowKind;
  },
): PlanExecutionOrigin {
  if (
    origin &&
    origin.side === context.side &&
    origin.stateVersion === context.stateVersion &&
    origin.windowKind === context.windowKind
  ) {
    return structuredClone(origin);
  }
  throw new PlanResolutionFailure("window_origin_missing", {
    side: context.side,
    stateVersion: context.stateVersion,
    timingPoint: context.timingPoint,
    legalActionTypes: [],
    owner: "window_resolution",
    removalCondition:
      "Attach the current root plan, leaf executor and decision-window origin.",
  });
}

function assertCommitmentGraph(commitment: PlanCommitment): void {
  const actionKeys = recursiveKeys(commitment.nodes).filter((key) =>
    key.toLocaleLowerCase("en-US").includes("actionid"),
  );
  const ids = commitment.nodes.map((node) => node.nodeId);
  const idSet = new Set(ids);
  const invalidBranch = commitment.nodes.some((node) =>
    node.branches.some(
      (branch) => branch.nextNodeId && !idSet.has(branch.nextNodeId),
    ),
  );
  if (
    actionKeys.length > 0 ||
    ids.length !== idSet.size ||
    !idSet.has(commitment.currentNodeId) ||
    invalidBranch ||
    graphHasCycle(commitment.nodes)
  ) {
    throw new PlanResolutionFailure("commitment_invalidated", {
      side: commitment.side,
      stateVersion: commitment.createdAtStateVersion,
      timingPoint: "commitment_validation",
      legalActionTypes: [],
      owner: "continuation",
      removalCondition:
        "Use an acyclic semantic branch graph without future action ids.",
      planInstanceId: commitment.leafPlanInstanceId,
    });
  }
}

function graphHasCycle(nodes: readonly CommitmentNode[]): boolean {
  const edges = new Map(
    nodes.map((node) => [
      node.nodeId,
      node.branches.flatMap((branch) =>
        branch.nextNodeId ? [branch.nextNodeId] : [],
      ),
    ]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    if ((edges.get(id) ?? []).some(visit)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return nodes.some((node) => visit(node.nodeId));
}

function originFor(
  commitment: PlanCommitment,
  observation: ContinuationObservation,
): PlanExecutionOrigin {
  return {
    rootPlanInstanceId: commitment.rootPlanInstanceId,
    leafPlanInstanceId: commitment.leafPlanInstanceId,
    commitmentId: commitment.commitmentId,
    side: commitment.side,
    windowKind: observation.windowKind,
    windowId: observation.windowId,
    stateVersion: observation.stateVersion,
    timingPoint: observation.timingPoint,
  };
}

function deadlineExpired(
  deadline: CommitmentDeadline,
  observation: ContinuationObservation,
): boolean {
  return (
    deadline.stateVersionLimit !== undefined &&
    observation.stateVersion > deadline.stateVersionLimit
  );
}

function continuationFailure(
  code: "commitment_invalidated" | "window_origin_missing",
  commitment: PlanCommitment,
  observation: ContinuationObservation,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure(code, {
    side: observation.side,
    stateVersion: observation.stateVersion,
    timingPoint: observation.timingPoint,
    legalActionTypes: [],
    owner: "continuation",
    removalCondition,
    planInstanceId: commitment.leafPlanInstanceId,
  });
}

function recursiveKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => [
    key,
    ...recursiveKeys(nested),
  ]);
}
