import type { AiDecisionInput, Side } from "@netgrid/shared";
import type { EngineRandomizedIceInstallCandidate } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  compareValidatedPlanAssessments,
  requireValidatedPlanAssessment,
  type PlanAssessment,
  type PlanPriorityPolicy,
  type ValidatedPlanAssessment,
} from "./plan-assessment";
import type { PlanExecutionOrigin } from "./plan-continuation";
import type {
  PlanInstance,
  PlanModuleId,
  PlanProposal,
} from "./plan-kernel-types";
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
import {
  requireCurrentTransientPlanSignals,
  transientPlanSignalsForExactPlanTarget,
  type TransientPlanSignal,
} from "./transient-plan-signals";

export type PlanSchedulerContext = {
  input: AiDecisionInput;
  actionCandidates: readonly ActionSemanticCandidate[];
  actionDispositions?: readonly PlanActionDisposition[];
  transientSignals?: readonly TransientPlanSignal[];
  turnKey: string;
  domain?: unknown;
};

export type PlanActionDisposition = {
  actionId: string;
  disposition: "explicitly_nonproductive";
  ownerModuleId: PlanModuleId;
  evidenceCode: string;
};

export function isStandardEndTurnCandidate(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    candidate.actionType === "end_turn" &&
    candidate.semanticActionType === "turn_flow.end_turn" &&
    candidate.sourceKind === "game_rule"
  );
}

export type PlanEarlyEndTurnJustification =
  | {
      kind: "rules_proven_terminal_win";
      terminalCondition: "corp_empty_rd_mandatory_draw";
    }
  | {
      kind: "forgo_restricted_capacity";
      capacityKind: "zero_click_non_basic_run_only";
      explicitlyNonproductiveActionIds: string[];
    };

export type PlanMaterialization = {
  step: PlanRouteStep;
  candidates: PlanRouteCandidate[];
  engineRandomizedIceInstallNearTie?: {
    kind: "engine_randomized_ice_install_selection";
    candidates: EngineRandomizedIceInstallCandidate[];
  };
  continuation?: SemanticContinuation;
  earlyEndTurnJustification?: PlanEarlyEndTurnJustification;
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
      engineRandomizedIceInstallNearTie?: NonNullable<
        PlanMaterialization["engineRandomizedIceInstallNearTie"]
      >;
      diagnostics: SchedulerDiagnosticEvent[];
    };

export type RunPlanSchedulerParams = {
  context: PlanSchedulerContext;
  registry: SidePlanRegistry;
  previousPortfolio?: ResidentPlanPortfolio;
  resolveEngineWindow: EngineWindowResolver;
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
  assertActionDispositions(params.registry, params.context);
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
  const transientSignals = requireCurrentTransientPlanSignals(
    params.context.transientSignals,
    {
      side: params.registry.side,
      stateVersion: params.context.input.playerView.stateVersion,
      timingPoint: "plan_discovery",
    },
  );
  const context: PlanSchedulerContext =
    transientSignals.length > 0
      ? { ...params.context, transientSignals }
      : params.context;

  const proposals = params.registry.modules.flatMap((module) => {
    const discovered = module.discover(context);
    diagnostics.push({
      stage: "discover",
      code: `proposals:${discovered.length}`,
      moduleId: module.moduleId,
    });
    return discovered;
  });
  const reconciled = reconcileResidentPlanPortfolio({
    side: params.registry.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    proposals,
    ...(params.previousPortfolio ? { previous: params.previousPortfolio } : {}),
  });
  diagnostics.push({
    stage: "reconcile",
    code: `resident:${reconciled.instances.length}`,
  });

  const validatedAssessments = reconciled.instances
    .filter((instance) => instance.viability === "ready")
    .map((instance) => {
      const module = moduleForInstance(
        params.registry,
        instance,
        context,
      );
      const assessment = requireValidatedPlanAssessment(
        bindExactTransientPlanSignals(
          module.assess(instance, context, reconciled),
          instance,
          context,
        ),
        params.registry.priorityPolicy,
        context.input.playerView.stateVersion,
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
  assertVoluntaryActionPlanCoverage(
    params.registry,
    context,
    reconciled,
    validatedAssessments,
  );
  const assessments = validatedAssessments.filter(
    (assessment) => assessment.readiness === "executable_now",
  );
  if (assessments.length === 0) {
    throw schedulerFailure(
      "missing_plan_module_coverage",
      context,
      undefined,
      reconciled.instances.length,
      missingReadyPlanRemovalCondition(context),
    );
  }

  const selected = assessments[0]!;
  diagnostics.push({
    stage: "select",
    code: "validated_winner",
    instanceId: selected.instanceId,
    priorityClass: selected.priorityValidation.effectiveClass,
  });
  const instance = reconciled.instances.find(
    (candidate) => candidate.instanceId === selected.instanceId,
  );
  if (!instance) {
    throw schedulerFailure(
      "invalid_plan_identity",
      context,
      selected.instanceId,
      reconciled.instances.length,
      "Keep every validated assessment bound to a resident instance.",
    );
  }
  const module = moduleForInstance(params.registry, instance, context);
  const materialized = module.materialize(instance, selected, context);
  diagnostics.push({
    stage: "materialize",
    code: materialized.step.stepId,
    instanceId: instance.instanceId,
    moduleId: module.moduleId,
  });
  const route = bindBestCurrentPlanRoute({
    side: params.registry.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    planInstanceId: instance.instanceId,
    step: materialized.step,
    candidates: materialized.candidates,
    ...(materialized.continuation
      ? { continuation: materialized.continuation }
      : {}),
  });
  assertEngineRandomizedIceInstallNearTie(
    context,
    materialized,
    instance.instanceId,
  );
  assertEarlyEndTurnRoute(context, route, materialized, module.moduleId);
  const portfolio = reconcileResidentPlanPortfolio({
    side: params.registry.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    proposals,
    ...(params.previousPortfolio ? { previous: params.previousPortfolio } : {}),
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
    ...(materialized.engineRandomizedIceInstallNearTie?.candidates.some(
      (candidate) => candidate.actionId === route.head.actionId,
    )
      ? {
          engineRandomizedIceInstallNearTie:
            materialized.engineRandomizedIceInstallNearTie,
        }
      : {}),
    diagnostics,
  };
}

function bindExactTransientPlanSignals(
  assessment: PlanAssessment,
  instance: PlanInstance,
  context: PlanSchedulerContext,
): PlanAssessment {
  if (assessment.transientSignals !== undefined) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: "plan_assessment",
      legalActionTypes: [],
      owner: "priority_policy",
      planInstanceId: instance.instanceId,
      removalCondition:
        "Plan modules must not inject transient goal/threat evidence into their own assessment. The scheduler binds only current context signals for the exact resident module and target.",
    });
  }
  const transientSignals = transientPlanSignalsForExactPlanTarget(
    context.transientSignals,
    instance.moduleId,
    instance.dedupeKey,
    instance.target,
  );
  return transientSignals.length > 0
    ? { ...assessment, transientSignals }
    : assessment;
}

function assertEngineRandomizedIceInstallNearTie(
  context: PlanSchedulerContext,
  materialized: PlanMaterialization,
  planInstanceId: string,
): void {
  const selection = materialized.engineRandomizedIceInstallNearTie;
  if (!selection) return;
  const candidates = selection.candidates;
  const exactServers =
    candidates.length === 2 &&
    candidates[0]?.targetServerId === "hq" &&
    candidates[1]?.targetServerId === "rd";
  const exactActions =
    exactServers &&
    new Set(candidates.map((candidate) => candidate.actionId)).size === 2 &&
    candidates.every((candidate) => {
      const routeCandidate = materialized.candidates.find(
        (entry) => entry.candidate.actionId === candidate.actionId,
      )?.candidate;
      const legalAction = context.input.legalActions.find(
        (action) => action.actionId === candidate.actionId,
      );
      return (
        routeCandidate?.stateVersion ===
          context.input.playerView.stateVersion &&
        routeCandidate.semanticActionType === "install.card" &&
        legalAction?.type === "install_card" &&
        legalAction.side === "corp" &&
        legalAction.expiresAtStateVersion ===
          context.input.playerView.stateVersion &&
        legalAction.payload?.placement === "ice" &&
        legalAction.payload.serverId === candidate.targetServerId &&
        (legalAction.choiceRequirements?.length ?? 0) === 0 &&
        legalAction.targetRequirements.length === 0
      );
    });
  if (exactActions) return;
  throw new PlanResolutionFailure("invalid_support_graph", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    unresolvedActionIds: candidates.map((candidate) => candidate.actionId),
    owner: "support_graph",
    planInstanceId,
    removalCondition:
      "An Engine-randomized central near tie must contain exactly one current choice-free HQ and one current choice-free R&D ICE-install LegalAction from the materialized plan step.",
  });
}

function assertEarlyEndTurnRoute(
  context: PlanSchedulerContext,
  route: PlanRoute,
  materialized: PlanMaterialization,
  moduleId: PlanModuleId,
): void {
  const selectedCandidate = materialized.candidates.find(
    (entry) => entry.candidate.actionId === route.head.actionId,
  )?.candidate;
  if (
    !selectedCandidate ||
    !isStandardEndTurnCandidate(selectedCandidate) ||
    context.input.playerView.own.clicks <= 0
  ) {
    return;
  }

  const justification = materialized.earlyEndTurnJustification;
  const terminalWinProven =
    justification?.kind === "rules_proven_terminal_win" &&
    justification.terminalCondition === "corp_empty_rd_mandatory_draw" &&
    context.input.side === "runner" &&
    moduleId === "runner.secure_terminal_win" &&
    context.input.playerView.opponent.deckCount === 0;
  if (terminalWinProven) return;

  const remainingCandidates = context.actionCandidates.filter(
    (candidate) => !isStandardEndTurnCandidate(candidate),
  );
  const remainingActionIds = sortedUnique(
    remainingCandidates.map((candidate) => candidate.actionId),
  );
  const forgoProofActionIds =
    justification?.kind === "forgo_restricted_capacity"
      ? sortedUnique(justification.explicitlyNonproductiveActionIds)
      : [];
  const exactRestrictedActionSet =
    remainingActionIds.length > 0 &&
    sameStrings(remainingActionIds, forgoProofActionIds);
  const everyRemainingActionIsRestrictedRun =
    exactRestrictedActionSet &&
    remainingCandidates.every((candidate) => {
      const legalAction = context.input.legalActions.find(
        (action) => action.actionId === candidate.actionId,
      );
      return (
        candidate.semanticActionType === "run.start" &&
        candidate.actionType === "start_run" &&
        candidate.sourceKind !== "basic_action" &&
        legalAction?.type === "start_run" &&
        legalAction.source !== "basic_action" &&
        legalAction.costs.reduce(
          (total, cost) => total + Math.max(0, cost.clicks ?? 0),
          0,
        ) === 0
      );
    });
  const everyRestrictedRunIsExplicitlyNonproductive =
    everyRemainingActionIsRestrictedRun &&
    remainingActionIds.every((actionId) =>
      (context.actionDispositions ?? []).some(
        (entry) =>
          entry.actionId === actionId &&
          entry.disposition === "explicitly_nonproductive" &&
          entry.ownerModuleId === moduleId,
      ),
    );
  const restrictedCapacityForgoProven =
    justification?.kind === "forgo_restricted_capacity" &&
    justification.capacityKind === "zero_click_non_basic_run_only" &&
    context.input.side === "runner" &&
    moduleId === "runner.defense_and_recovery" &&
    everyRestrictedRunIsExplicitlyNonproductive;
  if (restrictedCapacityForgoProven) return;

  const exhaustedVoluntaryRoutes =
    moduleId === `${context.input.side}.complete_turn` &&
    remainingActionIds.length > 0 &&
    remainingActionIds.every((actionId) =>
      (context.actionDispositions ?? []).some(
        (entry) =>
          entry.actionId === actionId &&
          entry.disposition === "explicitly_nonproductive",
      ),
    );
  if (exhaustedVoluntaryRoutes) return;

  throw new PlanResolutionFailure("end_turn_with_usable_capacity", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    unresolvedActionIds: remainingActionIds,
    owner: "rules_contract",
    removalCondition:
      "Bind early standard EndTurn to a structurally proven terminal-win or restricted-capacity-forgo plan justification.",
    planInstanceId: route.planInstanceId,
    stepId: route.step.stepId,
    candidateCount: materialized.candidates.length,
  });
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function sameStrings(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function assertVoluntaryActionPlanCoverage(
  registry: SidePlanRegistry,
  context: PlanSchedulerContext,
  portfolio: ResidentPlanPortfolio,
  assessments: readonly ValidatedPlanAssessment[],
): void {
  const planOwnersByActionId = new Map<string, Set<string>>();
  for (const assessment of assessments) {
    if (assessment.readiness !== "executable_now") continue;
    const instance = portfolio.instances.find(
      (entry) => entry.instanceId === assessment.instanceId,
    );
    if (!instance) continue;
    const module = moduleForInstance(registry, instance, context);
    const materialization = module.materialize(instance, assessment, context);
    for (const entry of materialization.candidates) {
      bindBestCurrentPlanRoute({
        side: registry.side,
        stateVersion: context.input.playerView.stateVersion,
        timingPoint: context.input.playerView.timingPoint,
        planInstanceId: instance.instanceId,
        step: materialization.step,
        candidates: [entry],
        ...(materialization.continuation
          ? { continuation: materialization.continuation }
          : {}),
      });
      const owners =
        planOwnersByActionId.get(entry.candidate.actionId) ?? new Set<string>();
      owners.add(module.moduleId);
      planOwnersByActionId.set(entry.candidate.actionId, owners);
    }
  }
  const dispositionByActionId = new Map(
    (context.actionDispositions ?? []).map((entry) => [entry.actionId, entry]),
  );
  const contradictoryActionIds = [...planOwnersByActionId.keys()].filter(
    (actionId) => dispositionByActionId.has(actionId),
  );
  if (contradictoryActionIds.length > 0) {
    const conflicts = contradictoryActionIds
      .map((actionId) => {
        const disposition = dispositionByActionId.get(actionId)!;
        const routeOwners = [
          ...(planOwnersByActionId.get(actionId) ?? []),
        ].join("+");
        return `${disposition.evidenceCode}@${disposition.ownerModuleId}->${routeOwners}[${actionId}]`;
      })
      .join(",");
    throw schedulerFailure(
      "missing_plan_module_coverage",
      context,
      undefined,
      assessments.length,
      `Actions cannot be both executable plan routes and explicitly nonproductive dispositions. Conflicts=${conflicts}.`,
      contradictoryActionIds,
    );
  }
  const unresolvedActionIds = context.actionCandidates
    .filter(
      (candidate) =>
        !isStandardEndTurnCandidate(candidate) &&
        !planOwnersByActionId.has(candidate.actionId) &&
        !dispositionByActionId.has(candidate.actionId),
    )
    .map((candidate) => candidate.actionId);
  if (unresolvedActionIds.length > 0) {
    const unresolvedDetails = context.actionCandidates
      .filter((candidate) => unresolvedActionIds.includes(candidate.actionId))
      .map(
        (candidate) =>
          `${candidate.actionId}{semantic=${candidate.semanticActionType},sourceKind=${candidate.sourceKind},sourceDefinition=${candidate.sourceDefinitionId ?? "none"}}`,
      )
      .join(",");
    throw schedulerFailure(
      "missing_plan_module_coverage",
      context,
      undefined,
      assessments.length,
      `Unresolved=${unresolvedDetails}. Materialize each voluntary LegalAction in an executable plan route or reject it through exactly one registered owner module with a concrete nonproductive disposition. A family-level ownership declaration is not plan coverage.`,
      unresolvedActionIds,
    );
  }
}

function missingReadyPlanRemovalCondition(
  context: PlanSchedulerContext,
): string {
  const unresolved = unresolvedVoluntaryActionIds(context);
  if (context.input.playerView.own.clicks > 0 && unresolved.length === 0) {
    const rejected = (context.actionDispositions ?? [])
      .slice(0, 8)
      .map(
        (entry) =>
          `${entry.actionId}@${entry.ownerModuleId}:${entry.evidenceCode}`,
      )
      .join(",");
    return `Unused action capacity=${context.input.playerView.own.clicks} remains after every current voluntary action was explicitly rejected. Add a productive plan route or a domain-specific capacity-forgo plan; normal TurnCompletion is forbidden. Rejections=${rejected || "none"}.`;
  }
  return "Provide at least one ready assessed plan for the legal voluntary actions.";
}

function assertActionDispositions(
  registry: SidePlanRegistry,
  context: PlanSchedulerContext,
): void {
  const dispositions = context.actionDispositions ?? [];
  const knownActionIds = new Set(
    context.actionCandidates.map((candidate) => candidate.actionId),
  );
  const seen = new Set<string>();
  for (const entry of dispositions) {
    const dispositionCandidate = context.actionCandidates.find(
      (candidate) => candidate.actionId === entry.actionId,
    );
    const invalidReasons = [
      ...(!knownActionIds.has(entry.actionId) ? ["unknown_action"] : []),
      ...(seen.has(entry.actionId) ? ["duplicate_action"] : []),
      ...(!registry.modules.some(
        (module) => module.moduleId === entry.ownerModuleId,
      )
        ? ["unregistered_owner"]
        : []),
      ...(entry.evidenceCode.trim().length === 0 ? ["blank_evidence"] : []),
      ...(dispositionCandidate &&
      isStandardEndTurnCandidate(dispositionCandidate)
        ? ["end_turn_disposition"]
        : []),
    ];
    if (invalidReasons.length > 0) {
      throw schedulerFailure(
        "missing_plan_module_coverage",
        context,
        undefined,
        dispositions.length,
        `Invalid nonproductive action disposition reasons=${invalidReasons.join(",")} action=${entry.actionId} owner=${entry.ownerModuleId}. Each current non-EndTurn action may be explicitly rejected by one registered owner with concrete evidence exactly once.`,
      );
    }
    seen.add(entry.actionId);
  }
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
    | "stale_or_future_action_reference",
  context: PlanSchedulerContext,
  instanceId: string | undefined,
  candidateCount: number,
  removalCondition: string,
  unresolvedActionIds?: readonly string[],
): PlanResolutionFailure {
  return new PlanResolutionFailure(code, {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    unresolvedActionIds:
      unresolvedActionIds ?? unresolvedVoluntaryActionIds(context),
    owner: "scheduler",
    removalCondition,
    ...(instanceId ? { planInstanceId: instanceId } : {}),
    candidateCount,
  });
}

function unresolvedVoluntaryActionIds(context: PlanSchedulerContext): string[] {
  const explicitlyNonproductive = new Set(
    (context.actionDispositions ?? []).map((entry) => entry.actionId),
  );
  return context.actionCandidates
    .filter(
      (candidate) =>
        !isStandardEndTurnCandidate(candidate) &&
        !explicitlyNonproductive.has(candidate.actionId),
    )
    .map((candidate) => candidate.actionId);
}
