import type { Side } from "@netgrid/shared";

import {
  PlanResolutionFailure,
  type PlanResolutionFailureOwner,
} from "../plans/plan-resolution-failure";

export type AiSimulationRuntimeFailure = {
  classified: boolean;
  code: string;
  owner?: PlanResolutionFailureOwner;
  side: Side;
  stateVersion: number;
  timingPoint: string;
  planInstanceId?: string;
  stepId?: string;
  legalActionTypes?: string[];
  unresolvedActionIds?: string[];
};

export function classifiedSimulationRuntimeFailure(params: {
  code: string;
  owner: PlanResolutionFailureOwner;
  side: Side;
  stateVersion: number;
  timingPoint: string;
  planInstanceId?: string;
  stepId?: string;
  legalActionTypes?: readonly string[];
  unresolvedActionIds?: readonly string[];
}): AiSimulationRuntimeFailure {
  return {
    classified: true,
    code: redactedToken(params.code, "unknown_runtime_failure"),
    owner: params.owner,
    side: params.side,
    stateVersion: nonNegativeInteger(params.stateVersion),
    timingPoint: redactedToken(params.timingPoint, "unknown"),
    ...(params.planInstanceId
      ? { planInstanceId: redactedToken(params.planInstanceId) }
      : {}),
    ...(params.stepId ? { stepId: redactedToken(params.stepId) } : {}),
    ...(params.legalActionTypes
      ? {
          legalActionTypes: params.legalActionTypes.map((value) =>
            redactedToken(value, "unknown"),
          ),
        }
      : {}),
    ...(params.unresolvedActionIds
      ? {
          unresolvedActionIds: params.unresolvedActionIds.map((value) =>
            redactedToken(value, "unknown"),
          ),
        }
      : {}),
  };
}

export function classifySimulationRuntimeFailure(
  error: unknown,
  context: {
    side: Side;
    stateVersion: number;
    timingPoint: string;
  },
): AiSimulationRuntimeFailure {
  if (error instanceof PlanResolutionFailure) {
    return classifiedSimulationRuntimeFailure({
      code: error.code,
      owner: error.context.owner,
      side: error.context.side,
      stateVersion: error.context.stateVersion,
      timingPoint: error.context.timingPoint,
      ...(error.context.planInstanceId
        ? { planInstanceId: error.context.planInstanceId }
        : {}),
      ...(error.context.stepId ? { stepId: error.context.stepId } : {}),
      legalActionTypes: error.context.legalActionTypes,
      ...(error.context.unresolvedActionIds
        ? { unresolvedActionIds: error.context.unresolvedActionIds }
        : {}),
    });
  }

  const knownBoundaryFailure = knownBoundaryFailureFor(error);
  if (knownBoundaryFailure) {
    return classifiedSimulationRuntimeFailure({
      ...knownBoundaryFailure,
      ...context,
    });
  }

  return {
    classified: false,
    code: "unclassified_runtime_failure",
    side: context.side,
    stateVersion: nonNegativeInteger(context.stateVersion),
    timingPoint: redactedToken(context.timingPoint, "unknown"),
  };
}

export function simulationRuntimeFailureToken(
  failure: AiSimulationRuntimeFailure,
): string {
  return [
    `runtime_failure:${failure.code}`,
    `classified:${failure.classified}`,
    `owner:${failure.owner ?? "unclassified"}`,
    `side:${failure.side}`,
    `stateVersion:${failure.stateVersion}`,
    `timing:${failure.timingPoint}`,
    ...(failure.planInstanceId
      ? [`plan:${failure.planInstanceId}`]
      : []),
    ...(failure.stepId ? [`step:${failure.stepId}`] : []),
    ...(failure.legalActionTypes
      ? [`legalActionTypes:${failure.legalActionTypes.join(",") || "none"}`]
      : []),
    ...(failure.unresolvedActionIds
      ? [`unresolvedActionIds:${failure.unresolvedActionIds.join(",") || "none"}`]
      : []),
  ].join(" ");
}

function knownBoundaryFailureFor(
  error: unknown,
):
  | {
      code: string;
      owner: PlanResolutionFailureOwner;
    }
  | undefined {
  const message = error instanceof Error ? error.message : "";
  if (message === "invalid_side_plan_registry") {
    return {
      code: "invalid_plan_identity",
      owner: "plan_registry",
    };
  }
  if (message === "plan_first_selected_action_not_legal") {
    return {
      code: "stale_or_future_action_reference",
      owner: "scheduler",
    };
  }
  return undefined;
}

function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function redactedToken(value: string, fallback = ""): string {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]+/g, "_")
    .slice(0, 160);
  return normalized || fallback;
}
