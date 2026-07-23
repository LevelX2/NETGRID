import type { Side } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { PlanTargetRef } from "./plan-kernel-types";
import {
  PlanResolutionFailure,
  type PlanResolutionFailureCode,
} from "./plan-resolution-failure";

export type PlanStepCapability = {
  capabilityId: string;
  semanticActionTypes: string[];
  legalActionTypes?: string[];
  requiredActionSignals?: string[];
  requiredCardSignals?: string[];
  requiredSourceDefinitionIds?: string[];
  requiredSourceRoles?: string[];
};

export type PlanRouteStep = {
  stepId: string;
  capability: PlanStepCapability;
  target?: PlanTargetRef;
  purpose: string;
};

export type SemanticContinuation = {
  continuationId: string;
  trigger:
    | "action_applied"
    | "choice_window_opened"
    | "run_window_opened"
    | "outcome_observed";
  nextCapability: PlanStepCapability;
  target?: PlanTargetRef;
  purpose: string;
};

export type PlanRouteHead = {
  planInstanceId: string;
  stepId: string;
  actionId: string;
  actionType: string;
  semanticActionType: string;
  stateVersion: number;
  target?: PlanTargetRef;
};

export type PlanRoute = {
  planInstanceId: string;
  step: PlanRouteStep;
  head: PlanRouteHead;
  continuation?: SemanticContinuation;
};

export type PlanRouteCandidate = {
  candidate: ActionSemanticCandidate;
  sourceRoles?: readonly string[];
  stepValue: number;
};

export type BindPlanRouteParams = {
  side: Side;
  stateVersion: number;
  timingPoint: string;
  planInstanceId: string;
  step: PlanRouteStep;
  candidates: readonly PlanRouteCandidate[];
  continuation?: SemanticContinuation;
};

type MatchResult =
  | { status: "compatible" }
  | {
      status: "incompatible";
      code:
        | "stale_or_future_action_reference"
        | "missing_action_semantics"
        | "step_capability_mismatch"
        | "step_target_mismatch";
    };

export function bindBestCurrentPlanRoute(
  params: BindPlanRouteParams,
): PlanRoute {
  assertSemanticContinuation(params, params.continuation);
  const matches = params.candidates.map((entry) => ({
    entry,
    match: matchPlanStepCandidate(
      params.step,
      entry.candidate,
      entry.sourceRoles ?? [],
      params.stateVersion,
    ),
  }));
  const compatible = matches
    .filter(
      (
        item,
      ): item is typeof item & { match: { status: "compatible" } } =>
        item.match.status === "compatible",
    )
    .map((item) => item.entry)
    .sort(compareRouteCandidates);

  const selected = compatible[0];
  if (!selected) {
    throw routeFailure(
      mostSpecificFailureCode(matches.map((item) => item.match)),
      params,
      0,
    );
  }

  const candidate = selected.candidate;
  const route: PlanRoute = {
    planInstanceId: params.planInstanceId,
    step: structuredClone(params.step),
    head: {
      planInstanceId: params.planInstanceId,
      stepId: params.step.stepId,
      actionId: candidate.actionId,
      actionType: candidate.actionType,
      semanticActionType: candidate.semanticActionType,
      stateVersion: params.stateVersion,
      ...(params.step.target
        ? { target: structuredClone(params.step.target) }
        : {}),
    },
    ...(params.continuation
      ? { continuation: structuredClone(params.continuation) }
      : {}),
  };
  assertCurrentPlanRoute(route, params);
  return route;
}

export function assertCurrentPlanRoute(
  route: PlanRoute,
  current: Pick<
    BindPlanRouteParams,
    "side" | "stateVersion" | "timingPoint" | "candidates"
  >,
): void {
  const currentCandidate = current.candidates.find(
    (entry) => entry.candidate.actionId === route.head.actionId,
  )?.candidate;
  if (
    route.head.stateVersion !== current.stateVersion ||
    currentCandidate?.stateVersion !== current.stateVersion ||
    currentCandidate.actionType !== route.head.actionType ||
    currentCandidate.semanticActionType !== route.head.semanticActionType
  ) {
    throw new PlanResolutionFailure("stale_or_future_action_reference", {
      side: current.side,
      stateVersion: current.stateVersion,
      timingPoint: current.timingPoint,
      legalActionTypes: current.candidates.map(
        (entry) => entry.candidate.actionType,
      ),
      owner: "action_semantics",
      removalCondition:
        "Rebind the route head from candidates projected for the current state version.",
      planInstanceId: route.planInstanceId,
      stepId: route.step.stepId,
      candidateCount: current.candidates.length,
      routeCount: 1,
    });
  }
}

export function matchPlanStepCandidate(
  step: PlanRouteStep,
  candidate: ActionSemanticCandidate,
  sourceRoles: readonly string[],
  stateVersion: number,
): MatchResult {
  if (candidate.stateVersion !== stateVersion) {
    return {
      status: "incompatible",
      code: "stale_or_future_action_reference",
    };
  }
  if (
    candidate.primaryProjectionStatus === "neutral_projected" ||
    candidate.primaryProjectionStatus === "schema_gap" ||
    candidate.primaryProjectionStatus === "blocked" ||
    candidate.primaryProjectionStatus === "hidden_info_blocked" ||
    candidate.semanticActionType === "unknown"
  ) {
    return { status: "incompatible", code: "missing_action_semantics" };
  }

  const capability = step.capability;
  const legalActionTypeMatches =
    capability.legalActionTypes === undefined ||
    capability.legalActionTypes.includes(candidate.actionType);
  const semanticTypeMatches = capability.semanticActionTypes.includes(
    candidate.semanticActionType,
  );
  const actionSignalsMatch = allRequiredPresent(
    capability.requiredActionSignals,
    candidate.actionTacticSignals,
  );
  const cardSignalsMatch = allRequiredPresent(
    capability.requiredCardSignals,
    candidate.cardContextSignals,
  );
  const sourceDefinitionMatches =
    capability.requiredSourceDefinitionIds === undefined ||
    (candidate.sourceDefinitionId !== undefined &&
      capability.requiredSourceDefinitionIds.includes(
        candidate.sourceDefinitionId,
      ));
  const sourceRolesMatch = allRequiredPresent(
    capability.requiredSourceRoles,
    sourceRoles,
  );
  if (
    !legalActionTypeMatches ||
    !semanticTypeMatches ||
    !actionSignalsMatch ||
    !cardSignalsMatch ||
    !sourceDefinitionMatches ||
    !sourceRolesMatch
  ) {
    return { status: "incompatible", code: "step_capability_mismatch" };
  }

  if (step.target && !candidateMatchesTarget(candidate, step.target)) {
    return { status: "incompatible", code: "step_target_mismatch" };
  }
  return { status: "compatible" };
}

function candidateMatchesTarget(
  candidate: ActionSemanticCandidate,
  target: PlanTargetRef,
): boolean {
  if (target.kind === "server") {
    return candidate.runProjectionSummary?.serverId === target.id;
  }
  if (
    (candidate.sourceCardInstanceId === target.id ||
      candidate.sourceDefinitionId === target.id)
  ) {
    return true;
  }
  return (
    candidate.targetContext?.selectedTargets.some(
      (candidateTarget) =>
        candidateTarget.targetId === target.id &&
        targetKindsCompatible(target.kind, candidateTarget.targetKind),
    ) ?? false
  );
}

function targetKindsCompatible(
  planKind: PlanTargetRef["kind"],
  candidateKind: string,
): boolean {
  if (planKind === candidateKind) return true;
  return planKind === "card" && candidateKind !== "server";
}

function allRequiredPresent(
  required: readonly string[] | undefined,
  actual: readonly string[],
): boolean {
  return required === undefined || required.every((value) => actual.includes(value));
}

function compareRouteCandidates(
  left: PlanRouteCandidate,
  right: PlanRouteCandidate,
): number {
  return (
    right.stepValue - left.stepValue ||
    left.candidate.actionId.localeCompare(right.candidate.actionId)
  );
}

function mostSpecificFailureCode(
  matches: readonly MatchResult[],
): PlanResolutionFailureCode {
  if (matches.length === 0) return "no_current_route_head";
  const codes = matches
    .filter(
      (
        match,
      ): match is Extract<MatchResult, { status: "incompatible" }> =>
        match.status === "incompatible",
    )
    .map((match) => match.code);
  if (codes.includes("stale_or_future_action_reference"))
    return "stale_or_future_action_reference";
  if (codes.includes("step_target_mismatch")) return "step_target_mismatch";
  if (codes.includes("step_capability_mismatch"))
    return "step_capability_mismatch";
  return "missing_action_semantics";
}

function routeFailure(
  code: PlanResolutionFailureCode,
  params: BindPlanRouteParams,
  routeCount: number,
): PlanResolutionFailure {
  return new PlanResolutionFailure(code, {
    side: params.side,
    stateVersion: params.stateVersion,
    timingPoint: params.timingPoint,
    legalActionTypes: params.candidates.map(
      (entry) => entry.candidate.actionType,
    ),
    owner:
      code === "missing_action_semantics" ||
      code === "stale_or_future_action_reference"
        ? "action_semantics"
        : "plan_module",
    removalCondition:
      code === "no_current_route_head"
        ? "Materialize a current semantic route head for this plan step."
        : "Provide a current candidate whose projected capability and target exactly satisfy the plan step.",
    planInstanceId: params.planInstanceId,
    stepId: params.step.stepId,
    candidateCount: params.candidates.length,
    routeCount,
  });
}

function assertSemanticContinuation(
  params: BindPlanRouteParams,
  continuation: SemanticContinuation | undefined,
): void {
  if (!continuation) return;
  const forbiddenKeys = findActionReferenceKeys(continuation);
  if (forbiddenKeys.length === 0) return;
  throw new PlanResolutionFailure("stale_or_future_action_reference", {
    side: params.side,
    stateVersion: params.stateVersion,
    timingPoint: params.timingPoint,
    legalActionTypes: params.candidates.map(
      (entry) => entry.candidate.actionType,
    ),
    owner: "continuation",
    removalCondition:
      "Describe continuations with semantic capabilities only; bind action ids after the next state is observed.",
    planInstanceId: params.planInstanceId,
    stepId: params.step.stepId,
    candidateCount: params.candidates.length,
  });
}

function findActionReferenceKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => [
    ...(key.toLocaleLowerCase("en-US").includes("actionid") ? [key] : []),
    ...findActionReferenceKeys(nested),
  ]);
}
