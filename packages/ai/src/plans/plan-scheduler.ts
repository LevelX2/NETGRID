import type { AiDecisionInput, Side } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  compareValidatedPlanAssessments,
  requireValidatedPlanAssessment,
  type PlanAssessment,
  type PlanPriorityPolicy,
  type ValidatedPlanAssessment,
} from "./plan-assessment";
import type { PlanExecutionOrigin } from "./plan-continuation";
import type { PlanInstance, PlanModuleId, PlanProposal } from "./plan-kernel-types";
import {
  applyPlanOutcomeReceipt,
  reconcileResidentPlanPortfolio,
  type PlanOutcomeReceipt,
  type ResidentPlanPortfolio,
} from "./resident-plan-portfolio";
import {
  bindBestCurrentPlanRoute,
  type PlanRoute,
  type PlanRouteCandidate,
  type PlanRouteStep,
  type SemanticContinuation,
} from "./plan-route";
import { PlanResolutionFailure } from "./plan-resolution-failure";

export type PlanSchedulerContext = {
  input: AiDecisionInput;
  actionCandidates: readonly ActionSemanticCandidate[];
  turnKey: string;
  domain?: unknown;
};

export type PlanMaterialization = {
  step: PlanRouteStep;
  candidates: PlanRouteCandidate[];
  continuation?: SemanticContinuation;
};

export type PlanModule = {
  moduleId: PlanModuleId;
  side: Side;
  discover(context: PlanSchedulerContext): PlanProposal[];
  assess(
    instance: PlanInstance,
    context: PlanSchedulerContext,
    portfolio: ResidentPlanPortfolio,
  ): PlanAssessment;
  materialize(
    instance: PlanInstance,
    assessment: ValidatedPlanAssessment,
    context: PlanSchedulerContext,
  ): PlanMaterialization;
};

export type SidePlanRegistry = {
  side: Side;
  priorityPolicy: PlanPriorityPolicy;
  modules: PlanModule[];
};

export type EngineWindowResolution = {
  actionId: string;
  origin: PlanExecutionOrigin;
  reasonCode: string;
};

export type EngineWindowResolver = (
  context: PlanSchedulerContext,
) => EngineWindowResolution | undefined;

export type SchedulerDiagnosticEvent = {
  stage:
    | "window"
    | "discover"
    | "reconcile"
    | "assess"
    | "select"
    | "materialize"
    | "replan"
    | "route";
  code: string;
  instanceId?: string;
  moduleId?: PlanModuleId;
  priorityClass?: string;
};

export type PlanSchedulerResult =
  | {
      lane: "engine_window";
      actionId: string;
      origin: PlanExecutionOrigin;
      portfolio?: ResidentPlanPortfolio;
      diagnostics: SchedulerDiagnosticEvent[];
    }
  | {
      lane: "plan";
      route: PlanRoute;
      selectedAssessment: ValidatedPlanAssessment;
      portfolio: ResidentPlanPortfolio;
      diagnostics: SchedulerDiagnosticEvent[];
    };

export type RunPlanSchedulerParams = {
  context: PlanSchedulerContext;
  registry: SidePlanRegistry;
  previousPortfolio?: ResidentPlanPortfolio;
  resolveEngineWindow: EngineWindowResolver;
  maxReplans?: number;
};

export type PlanSchedulerReceiptResult = {
  portfolio: ResidentPlanPortfolio;
  diagnostic: SchedulerDiagnosticEvent;
};

export function applyPlanSchedulerReceipt(
  portfolio: ResidentPlanPortfolio,
  receipt: PlanOutcomeReceipt,
  timingPoint: string,
): PlanSchedulerReceiptResult {
  const next = applyPlanOutcomeReceipt(portfolio, receipt, timingPoint);
  return {
    portfolio: next,
    diagnostic: {
      stage: "reconcile",
      code: `receipt:${receipt.progress}:${receipt.reasonCode}`,
      instanceId: receipt.planInstanceId,
    },
  };
}

export function runPlanScheduler(
  params: RunPlanSchedulerParams,
): PlanSchedulerResult {
  assertRegistry(params.registry, params.context);
  const diagnostics: SchedulerDiagnosticEvent[] = [];
  const window = params.resolveEngineWindow(params.context);
  if (window) {
    assertWindowResolution(window, params.context);
    diagnostics.push({ stage: "window", code: window.reasonCode });
    return {
      lane: "engine_window",
      actionId: window.actionId,
      origin: structuredClone(window.origin),
      ...(params.previousPortfolio
        ? { portfolio: structuredClone(params.previousPortfolio) }
        : {}),
      diagnostics,
    };
  }

  const proposals = params.registry.modules.flatMap((module) => {
    const discovered = module.discover(params.context);
    diagnostics.push({
      stage: "discover",
      code: `proposals:${discovered.length}`,
      moduleId: module.moduleId,
    });
    return discovered;
  });
  const reconciled = reconcileResidentPlanPortfolio({
    side: params.registry.side,
    stateVersion: params.context.input.playerView.stateVersion,
    timingPoint: params.context.input.playerView.timingPoint,
    proposals,
    ...(params.previousPortfolio ? { previous: params.previousPortfolio } : {}),
  });
  diagnostics.push({
    stage: "reconcile",
    code: `resident:${reconciled.instances.length}`,
  });

  const assessments = reconciled.instances
    .filter((instance) => instance.viability === "ready")
    .map((instance) => {
      const module = moduleForInstance(params.registry, instance, params.context);
      const assessment = requireValidatedPlanAssessment(
        module.assess(instance, params.context, reconciled),
        params.registry.priorityPolicy,
        params.context.input.playerView.stateVersion,
      );
      diagnostics.push({
        stage: "assess",
        code: "validated",
        instanceId: instance.instanceId,
        moduleId: module.moduleId,
        priorityClass: assessment.priorityValidation.effectiveClass,
      });
      return assessment;
    })
    .sort(compareValidatedPlanAssessments);
  if (assessments.length === 0) {
    throw schedulerFailure(
      "missing_plan_module_coverage",
      params.context,
      undefined,
      reconciled.instances.length,
      "Provide at least one ready assessed plan for the legal voluntary actions.",
    );
  }

  const excluded = new Set<string>();
  const maxReplans = Math.max(0, Math.min(8, params.maxReplans ?? 2));
  for (let attempt = 0; attempt <= maxReplans; attempt += 1) {
    const selected = assessments.find(
      (assessment) => !excluded.has(assessment.instanceId),
    );
    if (!selected) break;
    diagnostics.push({
      stage: "select",
      code: `attempt:${attempt}`,
      instanceId: selected.instanceId,
      priorityClass: selected.priorityValidation.effectiveClass,
    });
    const instance = reconciled.instances.find(
      (candidate) => candidate.instanceId === selected.instanceId,
    );
    if (!instance) {
      throw schedulerFailure(
        "invalid_plan_identity",
        params.context,
        selected.instanceId,
        reconciled.instances.length,
        "Keep every validated assessment bound to a resident instance.",
      );
    }
    const module = moduleForInstance(params.registry, instance, params.context);
    try {
      const materialized = module.materialize(
        instance,
        selected,
        params.context,
      );
      diagnostics.push({
        stage: "materialize",
        code: materialized.step.stepId,
        instanceId: instance.instanceId,
        moduleId: module.moduleId,
      });
      const route = bindBestCurrentPlanRoute({
        side: params.registry.side,
        stateVersion: params.context.input.playerView.stateVersion,
        timingPoint: params.context.input.playerView.timingPoint,
        planInstanceId: instance.instanceId,
        step: materialized.step,
        candidates: materialized.candidates,
        ...(materialized.continuation
          ? { continuation: materialized.continuation }
          : {}),
      });
      const portfolio = reconcileResidentPlanPortfolio({
        side: params.registry.side,
        stateVersion: params.context.input.playerView.stateVersion,
        timingPoint: params.context.input.playerView.timingPoint,
        proposals,
        ...(params.previousPortfolio
          ? { previous: params.previousPortfolio }
          : {}),
        selectedExecutorInstanceId: instance.instanceId,
        selectionReason:
          params.previousPortfolio?.executorInstanceId &&
          params.previousPortfolio.executorInstanceId !== instance.instanceId
            ? "preempted_by_higher_class"
            : "executor_selected",
      });
      diagnostics.push({
        stage: "route",
        code: route.head.semanticActionType,
        instanceId: instance.instanceId,
      });
      return {
        lane: "plan",
        route,
        selectedAssessment: selected,
        portfolio,
        diagnostics,
      };
    } catch (error) {
      if (!(error instanceof PlanResolutionFailure)) throw error;
      excluded.add(selected.instanceId);
      diagnostics.push({
        stage: "replan",
        code: error.code,
        instanceId: selected.instanceId,
      });
    }
  }
  throw schedulerFailure(
    "scheduler_replan_exhausted",
    params.context,
    undefined,
    assessments.length,
    `Repair the failing plan module or semantic route; no arbitrary action fallback is permitted. Failed routes: ${
      diagnostics
        .filter((event) => event.stage === "replan")
        .map((event) => `${event.instanceId ?? "unknown"}:${event.code}`)
        .join(",") || "none"
    }.`,
  );
}

export function createSidePlanRegistry(params: {
  side: Side;
  priorityPolicy: PlanPriorityPolicy;
  modules: readonly PlanModule[];
}): SidePlanRegistry {
  const modules = [...params.modules].sort((left, right) =>
    left.moduleId.localeCompare(right.moduleId),
  );
  if (
    params.priorityPolicy.side !== params.side ||
    modules.some(
      (module) =>
        module.side !== params.side ||
        !module.moduleId.startsWith(`${params.side}.`),
    ) ||
    new Set(modules.map((module) => module.moduleId)).size !== modules.length
  ) {
    throw new Error("invalid_side_plan_registry");
  }
  return { side: params.side, priorityPolicy: params.priorityPolicy, modules };
}

function moduleForInstance(
  registry: SidePlanRegistry,
  instance: PlanInstance,
  context: PlanSchedulerContext,
): PlanModule {
  const module = registry.modules.find(
    (candidate) => candidate.moduleId === instance.moduleId,
  );
  if (module) return module;
  throw schedulerFailure(
    "missing_plan_module_coverage",
    context,
    instance.instanceId,
    registry.modules.length,
    "Register the module that owns the resident plan instance.",
  );
}

function assertRegistry(
  registry: SidePlanRegistry,
  context: PlanSchedulerContext,
): void {
  if (
    registry.side === context.input.side &&
    registry.priorityPolicy.side === registry.side
  )
    return;
  throw schedulerFailure(
    "missing_plan_module_coverage",
    context,
    undefined,
    registry.modules.length,
    "Use the side-specific registry and priority policy matching the actor.",
  );
}

function assertWindowResolution(
  resolution: EngineWindowResolution,
  context: PlanSchedulerContext,
): void {
  const candidate = context.actionCandidates.find(
    (value) => value.actionId === resolution.actionId,
  );
  if (
    !candidate ||
    candidate.stateVersion !== context.input.playerView.stateVersion ||
    resolution.origin.stateVersion !== context.input.playerView.stateVersion ||
    resolution.origin.side !== context.input.side
  ) {
    throw schedulerFailure(
      "stale_or_future_action_reference",
      context,
      resolution.origin.leafPlanInstanceId,
      context.actionCandidates.length,
      "Resolve the engine window from a current legal semantic candidate and current origin.",
    );
  }
}

function schedulerFailure(
  code:
    | "missing_plan_module_coverage"
    | "invalid_plan_identity"
    | "stale_or_future_action_reference"
    | "scheduler_replan_exhausted",
  context: PlanSchedulerContext,
  instanceId: string | undefined,
  candidateCount: number,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure(code, {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    owner: "scheduler",
    removalCondition,
    ...(instanceId ? { planInstanceId: instanceId } : {}),
    candidateCount,
  });
}
