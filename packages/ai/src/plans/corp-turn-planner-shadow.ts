import {
  AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionInput,
  type AiTurnPlanningDebug,
  type LegalAction,
  type TargetRequirement,
} from "@netgrid/shared";

import type {
  ActionSemanticCandidate,
  LegalTarget,
  LegalTargetSummary,
} from "../action-semantic-candidate-types";
import type { CorpPlanDomain } from "./corp-tactical-plan-modules";
import {
  buildCorpAgendaTurnPlanningSlice,
  type CorpAgendaTurnPlanningLine,
  type CorpAgendaTurnPlanningSlice,
} from "./corp-agenda-turn-planning";
import {
  buildCorpDefenseTurnPlanningSlice,
  type CorpDefenseTurnPlanningLine,
  type CorpDefenseTurnPlanningSlice,
} from "./corp-defense-turn-planning";
import {
  buildCorpTurnPlanningCoverageReport,
  corpTurnPlanningModuleCoverage,
  type CorpTurnPlanningCoverageReport,
} from "./corp-turn-planning-coverage";
import type { PlanModuleId, PlanTargetRef } from "./plan-kernel-types";
import {
  enumerateCurrentPlanSchedulerRoutes,
  type PlanSchedulerContext,
  type PlanSchedulerPlanningRouteCandidate,
  type PlanSchedulerResult,
  type SidePlanRegistry,
} from "./plan-scheduler";
import {
  buildCanonicalLegalActionInvocation,
  buildSemanticActionSetFingerprint,
  turnPlanningFingerprint,
  type CampaignMilestoneQuote,
  type CampaignValueClaim,
  type CanonicalChoiceBinding,
  type CanonicalChoiceValue,
  type CanonicalLegalActionInvocation,
  type PlanningRulesContext,
  type PlanningStateIdentity,
  type PriorityCoverage,
  type TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";
import {
  assessTurnObservationBoundary,
  buildProjectedDecisionFrame,
  type BoundaryActionAssessment,
} from "./turn-projection";
import {
  searchDeterministicRemainderTurnPlans,
  type TurnRemainderSearchLine,
  type TurnRemainderSearchOffer,
} from "./turn-remainder-search";

export const CORP_TURN_PLANNER_SHADOW_SCHEMA_VERSION =
  "corp-turn-planner-shadow-v1" as const;

type PlanningInput = AiDecisionInput & {
  planningRulesContext?: PlanningRulesContext;
  planningStateIdentity?: PlanningStateIdentity;
};

type HeadVariant = {
  invocation: CanonicalLegalActionInvocation;
  nextMilestoneId: string;
  instanceHorizon: "current_turn" | "multi_turn";
  campaignQuote?: CampaignMilestoneQuote;
  evaluationValues: Record<string, number>;
  valueClaims: CampaignValueClaim[];
  evidenceCodes: string[];
  variantKey: string;
};

export type CorpTurnPlannerShadowResult = {
  schemaVersion: typeof CORP_TURN_PLANNER_SHADOW_SCHEMA_VERSION;
  debug: AiTurnPlanningDebug;
  coverage: CorpTurnPlanningCoverageReport;
  liveActionId: string;
  shadowActionId?: string;
  agreement: boolean;
};

export function buildCorpTurnPlannerShadow(params: {
  input: AiDecisionInput;
  context: PlanSchedulerContext;
  registry: SidePlanRegistry;
  runtimeResult: Extract<PlanSchedulerResult, { lane: "plan" }>;
  selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecision["selectedChoices"] | undefined;
}): CorpTurnPlannerShadowResult | undefined {
  const input = params.input as PlanningInput;
  const rulesContext = input.planningRulesContext;
  const stateIdentity = input.planningStateIdentity;
  if (input.side !== "corp" || !rulesContext || !stateIdentity) {
    return undefined;
  }

  const enumeration = enumerateCurrentPlanSchedulerRoutes({
    context: params.context,
    registry: params.registry,
    portfolio: params.runtimeResult.portfolio,
  });
  const domain = params.context.domain as CorpPlanDomain | undefined;
  const agendaSlices = domain
    ? domain.scoreProjects.map((project) => ({
        projectId: project.projectId,
        slice: buildCorpAgendaTurnPlanningSlice({
          input,
          project,
          candidates: params.context.actionCandidates,
          rulesContext,
          stateIdentity,
        }),
      }))
    : [];
  const defenseSlice = domain
    ? buildCorpDefenseTurnPlanningSlice({
        input,
        defenseNeeds: domain.defenseNeeds,
        economyNeeds: domain.economyNeeds,
        candidates: params.context.actionCandidates,
        stateIdentity,
      })
    : undefined;
  const planningRoutes = includeSpecializedCurrentRoutes({
    routes: enumeration.candidates,
    candidates: params.context.actionCandidates,
    agendaSlices,
    defenseSlice,
  });
  const heads = planningRoutes.flatMap((route) =>
    headsForRoute({
      input,
      stateIdentity,
      route,
      portfolio: params.runtimeResult.portfolio,
      agendaSlices,
      defenseSlice,
      selectedChoicesForDecision: params.selectedChoicesForDecision,
    }),
  );
  const coverage = buildCorpTurnPlanningCoverageReport({
    input,
    stateIdentity,
    candidates: params.context.actionCandidates,
    heads,
    dispositions: params.context.actionDispositions ?? [],
    engineWindowActionIds: [],
  });
  const entryFrame = buildProjectedDecisionFrame({
    input,
    rulesContext,
    stateIdentity,
    turnKey: params.context.turnKey,
  });
  const urgentPriorityClass = highestUrgentPriorityClass(heads);
  const offers = offersForHeads({
    input,
    heads,
    candidates: params.context.actionCandidates,
    urgentPriorityClass,
  });
  const search = searchDeterministicRemainderTurnPlans({
    entryFrame,
    offers,
  });
  const boundedSingleStepSearch = searchDeterministicRemainderTurnPlans({
    entryFrame,
    offers,
    budget: { maximumDepth: 1 },
  });
  const selectedLine = search.lines.find(
    (line) => line.lineId === search.selectedLineId,
  );
  const shadowHead = selectedLine?.steps[0]
    ? heads.find(
        (head) => head.candidateId === selectedLine.steps[0]!.candidateId,
      )
    : undefined;
  const liveActionId = params.runtimeResult.route.head.actionId;
  const shadowActionId = shadowHead?.currentBinding.actionId;
  const boundedSingleStepLine = boundedSingleStepSearch.lines.find(
    (line) => line.lineId === boundedSingleStepSearch.selectedLineId,
  );
  const greedyBaselineHead = boundedSingleStepLine?.steps[0]
    ? heads.find(
        (head) =>
          head.candidateId === boundedSingleStepLine.steps[0]!.candidateId,
      )
    : undefined;
  const debug = debugForShadow({
    input,
    rulesContext,
    stateIdentity,
    heads,
    coverage,
    search,
    selectedLine,
    entryFrameKey: entryFrame.projectedFrameKey,
    liveActionId,
    shadowHead,
    greedyBaselineHead,
    agendaSlices,
    defenseSlice,
    enumerationIssues: enumeration.issues,
    portfolio: params.runtimeResult.portfolio,
    candidates: params.context.actionCandidates,
  });
  return {
    schemaVersion: CORP_TURN_PLANNER_SHADOW_SCHEMA_VERSION,
    debug,
    coverage,
    liveActionId,
    ...(shadowActionId ? { shadowActionId } : {}),
    agreement: shadowActionId === liveActionId,
  };
}

function includeSpecializedCurrentRoutes(params: {
  routes: readonly PlanSchedulerPlanningRouteCandidate[];
  candidates: readonly ActionSemanticCandidate[];
  agendaSlices: Array<{
    projectId: string;
    slice: CorpAgendaTurnPlanningSlice;
  }>;
  defenseSlice: CorpDefenseTurnPlanningSlice | undefined;
}): PlanSchedulerPlanningRouteCandidate[] {
  const routes = params.routes.map((route) => structuredClone(route));
  const addRoute = (
    actionId: string,
    moduleId: PlanModuleId,
    projectId?: string,
  ): void => {
    if (
      routes.some(
        (route) =>
          route.instance.moduleId === moduleId &&
          route.candidate.actionId === actionId &&
          (projectId === undefined || route.instance.dedupeKey === projectId),
      )
    ) {
      return;
    }
    const candidate = params.candidates.find(
      (entry) => entry.actionId === actionId,
    );
    const base = params.routes.find(
      (route) =>
        route.instance.moduleId === moduleId &&
        (projectId === undefined || route.instance.dedupeKey === projectId),
    );
    if (!candidate || !base) return;
    routes.push({
      ...structuredClone(base),
      candidate: structuredClone(candidate),
    });
  };

  for (const { projectId, slice } of params.agendaSlices) {
    for (const line of slice.lines) {
      const ownerModuleId = line.nodes[0]?.ownerModuleId;
      if (line.currentActionId && ownerModuleId === "corp.score_agenda") {
        addRoute(line.currentActionId, ownerModuleId, projectId);
      }
    }
  }
  for (const line of params.defenseSlice?.lines ?? []) {
    const ownerModuleId = line.nodes[0]?.ownerModuleId;
    if (
      line.currentActionId &&
      (ownerModuleId === "corp.defend_servers" ||
        ownerModuleId === "corp.economy")
    ) {
      addRoute(line.currentActionId, ownerModuleId);
    }
  }

  return routes.sort(
    (left, right) =>
      left.instance.instanceId.localeCompare(right.instance.instanceId) ||
      left.candidate.actionId.localeCompare(right.candidate.actionId),
  );
}

function headsForRoute(params: {
  input: AiDecisionInput;
  stateIdentity: PlanningStateIdentity;
  route: PlanSchedulerPlanningRouteCandidate;
  portfolio: Extract<PlanSchedulerResult, { lane: "plan" }>["portfolio"];
  agendaSlices: Array<{
    projectId: string;
    slice: CorpAgendaTurnPlanningSlice;
  }>;
  defenseSlice: CorpDefenseTurnPlanningSlice | undefined;
  selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecision["selectedChoices"] | undefined;
}): TurnPlanningHeadCandidate[] {
  const action = params.input.legalActions.find(
    (candidate) => candidate.actionId === params.route.candidate.actionId,
  );
  const moduleCoverage = corpTurnPlanningModuleCoverage(
    params.route.instance.moduleId,
  );
  if (!action || !moduleCoverage) return [];
  const selectedChoices = params.selectedChoicesForDecision(
    params.input,
    action,
  );
  const invocations = currentInvocationVariants({
    stateIdentity: params.stateIdentity,
    action,
    candidate: params.route.candidate,
    selectedChoices,
  });
  const specialized = specializedVariants(
    params.route,
    params.agendaSlices,
    params.defenseSlice,
  );
  const variants =
    specialized.length > 0
      ? specialized.flatMap((variant) =>
          invocations.map((invocation) => ({
            ...variant,
            invocation,
            variantKey: `${variant.variantKey}:${invocation.invocationKey}`,
          })),
        )
      : invocations.map(
          (invocation): HeadVariant => ({
            invocation,
            nextMilestoneId: params.route.step.capability.capabilityId,
            instanceHorizon: "current_turn",
            evaluationValues: genericEvaluationValues(params.route),
            valueClaims: [],
            evidenceCodes: [
              "current_plan_module_head",
              "shadow_single_step_projection",
              ...(params.route.continuation
                ? ["semantic_continuation_requires_real_state"]
                : ["future_projection_not_supported"]),
            ],
            variantKey: invocation.invocationKey,
          }),
        );
  const rootPlanInstanceId = findRootPlanInstanceId(
    params.route.instance.instanceId,
    params.portfolio,
  );
  const semanticActionSetFingerprint = buildSemanticActionSetFingerprint(
    params.input.legalActions,
  );
  return variants.map((variant) => {
    const stepFingerprint = turnPlanningFingerprint("planning-head-step", {
      moduleId: params.route.instance.moduleId,
      planInstanceId: params.route.instance.instanceId,
      rootPlanInstanceId,
      step: params.route.step,
      invocationKey: variant.invocation.invocationKey,
      nextMilestoneId: variant.nextMilestoneId,
    });
    const candidateId = turnPlanningFingerprint("planning-head", {
      sideSafePlanningFingerprint:
        params.stateIdentity.sideSafePlanningFingerprint,
      rootPlanInstanceId,
      planInstanceId: params.route.instance.instanceId,
      stepFingerprint,
      variantKey: variant.variantKey,
    });
    return {
      candidateId,
      side: "corp",
      moduleId: params.route.instance.moduleId,
      rootPlanInstanceId,
      nextMilestoneId: variant.nextMilestoneId,
      stepFingerprint,
      horizonCapability: moduleCoverage.horizonCapability,
      instanceHorizon: variant.instanceHorizon,
      priorityClass: params.route.assessment.priorityValidation.effectiveClass,
      invocation: variant.invocation,
      currentBinding: {
        actionId: action.actionId,
        stateVersion: params.stateIdentity.stateVersion,
        semanticActionSetFingerprint,
        invocationKey: variant.invocation.invocationKey,
      },
      executableWitness: {
        stateVersion: params.stateIdentity.stateVersion,
        sideSafePlanningFingerprint:
          params.stateIdentity.sideSafePlanningFingerprint,
        semanticActionSetFingerprint,
        stepFingerprint,
        invocationKey: variant.invocation.invocationKey,
        quoteIds: variant.campaignQuote ? [variant.campaignQuote.quoteId] : [],
        safetyPolicyVersion: "corp-turn-planner-shadow-v1",
        allRouteDefiningChoicesBound: true,
      },
      ...(variant.campaignQuote
        ? { campaignQuote: structuredClone(variant.campaignQuote) }
        : {}),
      evaluationValues: { ...variant.evaluationValues },
      valueClaims: structuredClone(variant.valueClaims),
      evidenceCodes: [
        ...variant.evidenceCodes,
        `plan_instance:${params.route.instance.instanceId}`,
        `root_plan_instance:${rootPlanInstanceId}`,
      ],
    };
  });
}

function specializedVariants(
  route: PlanSchedulerPlanningRouteCandidate,
  agendaSlices: Array<{
    projectId: string;
    slice: CorpAgendaTurnPlanningSlice;
  }>,
  defenseSlice: CorpDefenseTurnPlanningSlice | undefined,
): Omit<HeadVariant, "invocation">[] {
  if (route.instance.moduleId === "corp.score_agenda") {
    const slice = agendaSlices.find(
      (entry) => entry.projectId === route.instance.dedupeKey,
    )?.slice;
    return (
      slice?.lines
        .filter(
          (line) =>
            line.currentActionId === route.candidate.actionId &&
            line.nodes[0]?.ownerModuleId === route.instance.moduleId,
        )
        .map(agendaVariant) ?? []
    );
  }
  if (
    route.instance.moduleId === "corp.defend_servers" ||
    route.instance.moduleId === "corp.economy"
  ) {
    return (
      defenseSlice?.lines
        .filter(
          (line) =>
            line.currentActionId === route.candidate.actionId &&
            line.nodes[0]?.ownerModuleId === route.instance.moduleId,
        )
        .map(defenseVariant) ?? []
    );
  }
  return [];
}

function agendaVariant(
  line: CorpAgendaTurnPlanningLine,
): Omit<HeadVariant, "invocation"> {
  return {
    nextMilestoneId: line.campaignQuote.nextMilestoneId,
    instanceHorizon: "multi_turn",
    campaignQuote: structuredClone(line.campaignQuote),
    evaluationValues: {
      agenda_progress: line.evaluation.agendaProgress,
      defense: line.evaluation.defense,
      economy: line.evaluation.economy,
      continuity: line.evaluation.continuity,
      risk: line.evaluation.risk,
    },
    valueClaims: structuredClone(line.valueClaims),
    evidenceCodes: [
      ...line.evidenceCodes,
      `agenda_line_family:${line.family}`,
      "domain_projected_campaign_quote",
    ],
    variantKey: line.lineId,
  };
}

function defenseVariant(
  line: CorpDefenseTurnPlanningLine,
): Omit<HeadVariant, "invocation"> {
  return {
    nextMilestoneId: line.campaignQuote.nextMilestoneId,
    instanceHorizon: "multi_turn",
    campaignQuote: structuredClone(line.campaignQuote),
    evaluationValues: {
      defense: line.defenseValue,
      economy: line.economyValue,
      flexibility: line.bluffValue,
      risk: line.fundingGapAfter,
    },
    valueClaims: structuredClone(line.valueClaims),
    evidenceCodes: [
      ...line.evidenceCodes,
      `defense_line_disposition:${line.disposition}`,
      "domain_projected_campaign_quote",
    ],
    variantKey: line.lineId,
  };
}

function genericEvaluationValues(
  route: PlanSchedulerPlanningRouteCandidate,
): Record<string, number> {
  const ownerKind = corpTurnPlanningModuleCoverage(
    route.instance.moduleId,
  )?.ownerKind;
  const dimension = {
    agenda: "agenda_progress",
    remote: "agenda_progress",
    defense: "defense",
    economy: "economy",
    virus: "defense",
    punish: "terminal_outcome",
    ambush: "terminal_outcome",
    hand: "hand_quality",
    turn_completion: "flexibility",
  }[ownerKind ?? "turn_completion"];
  return {
    [dimension]: boundedUtility(
      route.assessment.withinClassValue + route.stepValue,
    ),
  };
}

function boundedUtility(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-10_000, Math.min(10_000, Math.round(value)));
}

function currentInvocationVariants(params: {
  stateIdentity: PlanningStateIdentity;
  action: LegalAction;
  candidate: ActionSemanticCandidate;
  selectedChoices: AiDecision["selectedChoices"] | undefined;
}): CanonicalLegalActionInvocation[] {
  const targetVariants = targetBindingVariants(params.action, params.candidate);
  const boundChoices = choiceBindings(params.action, params.selectedChoices);
  if (targetVariants.length === 0 || boundChoices === undefined) return [];
  return targetVariants.map((boundTargets) =>
    buildCanonicalLegalActionInvocation({
      stateIdentity: params.stateIdentity,
      semanticActionType: params.candidate.semanticActionType,
      ...(params.candidate.sourceCardInstanceId
        ? { sourceCardInstanceId: params.candidate.sourceCardInstanceId }
        : {}),
      ...(params.candidate.abilityId
        ? { sourceAbilityId: params.candidate.abilityId }
        : {}),
      boundTargets,
      boundChoices,
    }),
  );
}

function targetBindingVariants(
  action: LegalAction,
  candidate: ActionSemanticCandidate,
): CanonicalLegalActionInvocation["boundTargets"][] {
  if (action.targetRequirements.length === 0) return [[]];
  if (
    action.targetRequirements.some(
      (requirement) => requirement.visibility === "engine_only",
    )
  ) {
    return [];
  }
  let variants: CanonicalLegalActionInvocation["boundTargets"][] = [[]];
  for (const requirement of action.targetRequirements) {
    const targets = targetsForRequirement(action, candidate, requirement);
    if (targets.length === 0) return [];
    variants = variants.flatMap((current) =>
      targets.map((target) => [
        ...current,
        {
          slotId: requirement.id,
          values: [target],
          ordering: "single" as const,
        },
      ]),
    );
    if (variants.length > 16) return [];
  }
  return variants;
}

function targetsForRequirement(
  action: LegalAction,
  candidate: ActionSemanticCandidate,
  requirement: TargetRequirement,
): PlanTargetRef[] {
  const selected = (candidate.targetContext?.selectedTargets ?? []).filter(
    (target) => targetMatchesRequirement(target, requirement),
  );
  const available = (candidate.targetContext?.availableTargets ?? []).filter(
    (target) => targetMatchesRequirement(target, requirement),
  );
  const payload = payloadTargetForRequirement(action, requirement);
  const ids =
    selected.length > 0
      ? selected.map((target) => target.targetId)
      : payload
        ? [payload]
        : available.length > 0
          ? available.map((target) => target.targetId)
          : requirement.kind === "server"
            ? [...(requirement.allowedServers ?? [])]
            : requirement.kind === "side"
              ? [...(requirement.allowedSides ?? [])]
              : [];
  return [...new Set(ids)].sort().map((id) => targetRef(requirement.kind, id));
}

function targetMatchesRequirement(
  target: LegalTarget | LegalTargetSummary,
  requirement: TargetRequirement,
): boolean {
  if (requirement.kind === "server") return target.targetKind === "server";
  if (requirement.kind === "subroutine")
    return target.targetKind === "subroutine";
  if (requirement.kind === "side")
    return target.targetId === "corp" || target.targetId === "runner";
  return target.targetKind !== "server" && target.targetKind !== "choice";
}

function payloadTargetForRequirement(
  action: LegalAction,
  requirement: TargetRequirement,
): string | undefined {
  const payload = action.payload ?? {};
  const value =
    requirement.kind === "server"
      ? payload.serverId
      : requirement.kind === "subroutine"
        ? (payload.subroutineId ?? payload.iceId)
        : requirement.kind === "side"
          ? (payload.side ?? payload.targetSide)
          : (payload.cardId ??
            payload.targetCardId ??
            payload.iceId ??
            payload.resourceId);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function targetRef(kind: TargetRequirement["kind"], id: string): PlanTargetRef {
  return {
    kind:
      kind === "server"
        ? "server"
        : kind === "subroutine"
          ? "value"
          : kind === "side"
            ? "player"
            : "card",
    id,
  };
}

function choiceBindings(
  action: LegalAction,
  selectedChoices: AiDecision["selectedChoices"] | undefined,
): CanonicalChoiceBinding[] | undefined {
  const requirements = action.choiceRequirements ?? [];
  if (requirements.length === 0) return [];
  if (!selectedChoices) return undefined;
  const bindings: CanonicalChoiceBinding[] = [];
  for (const requirement of requirements) {
    const value = selectedChoices[requirement.choiceId];
    const selectedOptionIds = choiceOptionIds(value);
    if (
      selectedOptionIds.length < requirement.minSelections ||
      selectedOptionIds.length > requirement.maxSelections ||
      selectedOptionIds.some(
        (optionId) => !requirement.optionIds.includes(optionId),
      )
    ) {
      return undefined;
    }
    const canonical = canonicalChoiceValue(value);
    if (!canonical) return undefined;
    bindings.push({
      choiceId: requirement.choiceId,
      role: "route_defining",
      value: canonical,
    });
  }
  return bindings;
}

function choiceOptionIds(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string"))
    return value;
  if (typeof value === "boolean" || typeof value === "number")
    return [String(value)];
  return [];
}

function canonicalChoiceValue(
  value: unknown,
): CanonicalChoiceValue | undefined {
  if (typeof value === "boolean") return { kind: "boolean", value };
  if (typeof value === "number" && Number.isFinite(value))
    return { kind: "number", value };
  if (typeof value === "string") return { kind: "string", value };
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string"))
    return {
      kind: "target_list",
      values: value.map((id) => ({ kind: "value", id })),
      ordering: "ordered",
    };
  return undefined;
}

function offersForHeads(params: {
  input: AiDecisionInput;
  heads: readonly TurnPlanningHeadCandidate[];
  candidates: readonly ActionSemanticCandidate[];
  urgentPriorityClass: string | undefined;
}): TurnRemainderSearchOffer[] {
  const candidateIdsByActionId = new Map<string, string[]>();
  for (const head of params.heads) {
    const actionId = head.currentBinding.actionId;
    candidateIdsByActionId.set(actionId, [
      ...(candidateIdsByActionId.get(actionId) ?? []),
      head.candidateId,
    ]);
  }
  const urgentHeadIds = params.urgentPriorityClass
    ? params.heads
        .filter((head) => head.priorityClass === params.urgentPriorityClass)
        .map((head) => head.candidateId)
    : [];
  return params.heads.flatMap((head) => {
    const candidate = params.candidates.find(
      (entry) => entry.actionId === head.currentBinding.actionId,
    );
    if (!candidate) return [];
    const dependencyVariants =
      params.urgentPriorityClass &&
      head.priorityClass !== params.urgentPriorityClass
        ? urgentHeadIds.map((candidateId) => [candidateId])
        : [[]];
    return dependencyVariants.map((dependencyCandidateIds) => {
      const priorityCoverage = priorityCoverageForHead(
        params.urgentPriorityClass,
      );
      const groupKey = commutativeGroupKey(candidate);
      const boundary = boundaryForCandidate(params.input, candidate);
      return {
        head,
        candidate,
        obligationSignature:
          priorityCoverage.requiredObligationIds.join(",") || "no_urgent",
        priorityCoverage,
        ...(dependencyCandidateIds.length > 0
          ? { dependencyCandidateIds, rootEligible: false }
          : {}),
        incompatibleCandidateIds: (
          candidateIdsByActionId.get(head.currentBinding.actionId) ?? []
        ).filter((candidateId) => candidateId !== head.candidateId),
        ...(groupKey
          ? {
              commutativeGroupKey: groupKey,
              commutativityCertified: true,
            }
          : {}),
        ...(boundary ? { boundaryAfter: boundary } : {}),
      } satisfies TurnRemainderSearchOffer;
    });
  });
}

function highestUrgentPriorityClass(
  heads: readonly TurnPlanningHeadCandidate[],
): string | undefined {
  return heads
    .map((head) => head.priorityClass)
    .filter((priorityClass) => ["P1", "P2", "P3"].includes(priorityClass))
    .sort()[0];
}

function priorityCoverageForHead(
  urgentPriorityClass: string | undefined,
): PriorityCoverage {
  if (!urgentPriorityClass) {
    return {
      requiredObligationIds: [],
      satisfiedObligationIds: [],
      violatedObligationIds: [],
      deferredObligationIds: [],
    };
  }
  const obligationId = `priority-band:${urgentPriorityClass}`;
  return {
    requiredObligationIds: [obligationId],
    satisfiedObligationIds: [obligationId],
    violatedObligationIds: [],
    deferredObligationIds: [],
  };
}

function boundaryForCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): BoundaryActionAssessment | undefined {
  const remainingActionCapacity = {
    minimum: Math.max(
      0,
      input.playerView.own.clicks - (candidate.costProfile.clickCost ?? 0),
    ),
    maximum: Math.max(
      0,
      input.playerView.own.clicks - (candidate.costProfile.clickCost ?? 0),
    ),
  };
  if (
    candidate.actionType === "draw_card" ||
    (candidate.economyProjection?.cardsDrawn ?? 0) > 0
  ) {
    return assessTurnObservationBoundary({
      boundaryKind: "private_observation",
      remainingActionCapacity,
      residualTurnValueBasis: "hand_quality_distribution",
      immediateOutcomeCodes: ["own_draw_identity_observed"],
      uncertainty: [{ code: "post_draw_replanning_required" }],
      assumptionIds: ["current_draw_route_executable"],
    });
  }
  if (
    candidate.randomBadPublicityModel?.randomOutcome ||
    candidate.actionCapacityProjection?.reliability === "random"
  ) {
    return assessTurnObservationBoundary({
      boundaryKind: "public_random_outcome",
      remainingActionCapacity,
      residualTurnValueBasis: "public_outcome_distribution",
      immediateOutcomeCodes: ["public_random_result_observed"],
      uncertainty: [{ code: "post_random_replanning_required" }],
      assumptionIds: ["current_random_route_executable"],
    });
  }
  return undefined;
}

function commutativeGroupKey(
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.sourceKind === "basic_action"
  ) {
    return "corp-basic-credit";
  }
  if (
    candidate.semanticActionType === "install.card" &&
    candidate.costProfile.costKnownStatus === "known" &&
    (candidate.targetContext?.selectedTargets.length ?? 0) === 1
  ) {
    return "corp-independent-current-install";
  }
  return undefined;
}

function debugForShadow(params: {
  input: AiDecisionInput;
  rulesContext: PlanningRulesContext;
  stateIdentity: PlanningStateIdentity;
  heads: TurnPlanningHeadCandidate[];
  coverage: CorpTurnPlanningCoverageReport;
  search: ReturnType<typeof searchDeterministicRemainderTurnPlans>;
  selectedLine: TurnRemainderSearchLine | undefined;
  entryFrameKey: string;
  liveActionId: string;
  shadowHead: TurnPlanningHeadCandidate | undefined;
  greedyBaselineHead: TurnPlanningHeadCandidate | undefined;
  agendaSlices: Array<{
    projectId: string;
    slice: CorpAgendaTurnPlanningSlice;
  }>;
  defenseSlice: CorpDefenseTurnPlanningSlice | undefined;
  enumerationIssues: Array<{
    instanceId: string;
    moduleId: PlanModuleId;
    code: string;
  }>;
  portfolio: Extract<PlanSchedulerResult, { lane: "plan" }>["portfolio"];
  candidates: readonly ActionSemanticCandidate[];
}): AiTurnPlanningDebug {
  const selectedLine =
    params.selectedLine ??
    fallbackLine(
      params.input,
      params.stateIdentity,
      params.liveActionId,
      params.heads,
    );
  const selectedHead = params.shadowHead ?? params.heads[0];
  const phases = debugPhases(
    selectedLine,
    params.heads,
    params.portfolio,
    params.entryFrameKey,
    params.input,
    params.candidates,
  );
  const agendaComparisonActionIds = new Set(
    [params.shadowHead?.currentBinding.actionId, params.liveActionId].filter(
      (actionId): actionId is string => actionId !== undefined,
    ),
  );
  const selectedAgendaSlice = params.agendaSlices.find((entry) =>
    entry.slice.lines.some(
      (line) =>
        line.currentActionId !== undefined &&
        agendaComparisonActionIds.has(line.currentActionId),
    ),
  )?.slice;
  const selectedDefenseLine = params.defenseSlice?.lines.find(
    (line) =>
      line.currentActionId === params.shadowHead?.currentBinding.actionId,
  );
  const selectedBoundary = selectedLine.steps
    .map((step) =>
      params.heads.find((head) => head.candidateId === step.candidateId),
    )
    .map((head) =>
      params.candidates.find(
        (candidate) => candidate.actionId === head?.currentBinding.actionId,
      ),
    )
    .map((candidate) =>
      candidate ? boundaryForCandidate(params.input, candidate) : undefined,
    )
    .find(
      (boundary): boundary is BoundaryActionAssessment =>
        boundary !== undefined,
    );

  return {
    schemaVersion: AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
    mode: "shadow",
    stateVersion: params.stateIdentity.stateVersion,
    sideSafePlanningFingerprint:
      params.stateIdentity.sideSafePlanningFingerprint,
    planningRulesFingerprint: params.rulesContext.fingerprint,
    turnKey: `corp:turn:${params.input.playerView.turnSerial ?? "unknown"}`,
    heads: params.heads.map((head) => ({
      candidateId: head.candidateId,
      moduleId: head.moduleId,
      rootPlanInstanceId: head.rootPlanInstanceId,
      actionId: head.currentBinding.actionId,
      semanticActionType: head.invocation.semanticActionType,
      invocationKey: head.invocation.invocationKey,
      witnessValid: true,
    })),
    selectedLine: {
      lineId: selectedLine.lineId,
      stopReason: debugStopReason(selectedLine),
      projectedFrameKey: selectedLine.projectedFrame.projectedFrameKey,
      cursor: { phaseIndex: 0, nodeIndex: 0 },
      phases,
    },
    ...(selectedHead
      ? {
          commitment: {
            commitmentId: turnPlanningFingerprint("shadow-commitment", {
              lineId: selectedLine.lineId,
              turnKey: params.input.playerView.turnSerial,
              stateIdentity: params.stateIdentity,
            }),
            status: "prospective",
            cursor: {
              phaseIndex: 0,
              nodeIndex: 0,
              phaseId: phases[0]?.phaseId ?? "shadow:no-phase",
              nodeId:
                phases[0]?.nodes[0]?.nodeId ?? selectedHead.stepFingerprint,
            },
            phaseEntry: {
              phaseId: phases[0]?.phaseId ?? "shadow:no-phase",
              status: "projection_only",
              reasonCode: "shadow_never_executes",
            },
            rematerialization: {
              status: "not_attempted",
              reasonCode: "shadow_never_executes",
            },
            observationClass:
              selectedLine.stopReason === "observation_boundary"
                ? "scheduled_information_boundary"
                : "expected_no_material_change",
          },
        }
      : {}),
    ...(selectedBoundary
      ? {
          boundary: {
            kind: selectedBoundary.boundaryKind,
            residualTurnValueBasis: selectedBoundary.residualTurnValueBasis,
            optionalityUnit: selectedBoundary.postBoundaryOptionality.unit,
            optionalityMinimum:
              selectedBoundary.postBoundaryOptionality.minimum,
            optionalityMaximum:
              selectedBoundary.postBoundaryOptionality.maximum,
          },
        }
      : {}),
    ...(selectedAgendaSlice
      ? { agendaComparison: agendaDebug(selectedAgendaSlice) }
      : {}),
    ...(params.defenseSlice &&
    (params.defenseSlice.lines.length > 0 ||
      params.defenseSlice.rejected.length > 0)
      ? {
          defenseComparison: {
            ...(selectedDefenseLine
              ? { selectedLineId: selectedDefenseLine.lineId }
              : params.defenseSlice.selectedLineId
                ? {
                    selectedLineId: params.defenseSlice.selectedLineId,
                  }
                : {}),
            lines: params.defenseSlice.lines.map((line) => ({
              lineId: line.lineId,
              targetServerId: line.targetServerId,
              disposition: line.disposition,
              actionCount: line.nodes.length,
              fundingGapBefore: line.fundingGapBefore,
              fundingGapAfter: line.fundingGapAfter,
              rezReadyAfterLine: line.rezReadyAfterLine,
              bluffValue: line.bluffValue,
              defenseValue: line.defenseValue,
              economyValue: line.economyValue,
              totalValue: line.totalValue,
            })),
            rejected: params.defenseSlice.rejected.map((entry) => ({
              ...entry,
            })),
          },
        }
      : {}),
    shadowComparison: {
      liveActionId: params.liveActionId,
      ...(params.shadowHead
        ? {
            shadowActionId: params.shadowHead.currentBinding.actionId,
            shadowRootPlanInstanceId: params.shadowHead.rootPlanInstanceId,
          }
        : {}),
      ...(params.greedyBaselineHead
        ? {
            boundedBaselineActionId:
              params.greedyBaselineHead.currentBinding.actionId,
          }
        : {}),
      agreement:
        params.shadowHead?.currentBinding.actionId === params.liveActionId,
      comparisonClass: shadowComparisonClass(
        params.liveActionId,
        params.shadowHead,
        params.greedyBaselineHead,
      ),
      twoStepChangedHead:
        params.shadowHead !== undefined &&
        params.greedyBaselineHead !== undefined &&
        params.shadowHead.currentBinding.actionId !==
          params.greedyBaselineHead.currentBinding.actionId,
    },
    coverage: {
      status: params.coverage.status,
      coveragePercent: params.coverage.coveragePercent,
      legalActionCount: params.coverage.legalActionCount,
      productiveActionCount: params.coverage.productiveActionCount,
      explicitlyNonproductiveActionCount:
        params.coverage.explicitlyNonproductiveActionCount,
      assessmentUnknownActionCount:
        params.coverage.assessmentUnknownActionCount,
      engineWindowActionCount: params.coverage.engineWindowActionCount,
      missingActionCount: params.coverage.missingActionCount,
      conflictingActionCount: params.coverage.conflictingActionCount,
      issueCodes: [
        ...new Set(params.coverage.issues.map((issue) => issue.code)),
      ].sort(),
      missingActionIds: params.coverage.actions
        .filter((action) => action.classification === "missing")
        .map((action) => action.actionId),
      conflictingActionIds: params.coverage.actions
        .filter((action) => action.classification === "conflicting")
        .map((action) => action.actionId),
    },
    search: {
      headCount: params.heads.length,
      lineCount: params.search.lines.length,
      expandedNodeCount: params.search.expandedNodeCount,
      protectedPartitionCount: params.search.protectedPartitionKeys.length,
      conservativeBaselineCount:
        params.search.conservativeBaselineLineIds.length,
      maximumDepth: params.search.budget.maximumDepth,
      maximumExpandedNodes: params.search.budget.maximumExpandedNodes,
      maximumBranchesPerPartition:
        params.search.budget.maximumBranchesPerPartition,
      maximumParetoLinesPerPartition:
        params.search.budget.maximumParetoLinesPerPartition,
      selectedLineScalarValue: selectedLine.scalarValue,
      selectedLineStepCount: selectedLine.steps.length,
    },
    consideredLines: params.search.lines.map((line) => ({
      lineId: line.lineId,
      firstActionId:
        params.heads.find(
          (head) => head.candidateId === line.steps[0]?.candidateId,
        )?.currentBinding.actionId ?? "unbound",
      rootPlanInstanceId: line.rootPlanInstanceId,
      stepCount: line.steps.length,
      scalarValue: line.scalarValue,
      stopReason: debugStopReason(line),
      violatedObligationCount:
        line.priorityCoverage.violatedObligationIds.length,
    })),
    pruneEvents: params.search.pruneEvents.map((event) => ({
      candidateId: event.candidateId,
      reasonCode: event.reasonCode,
    })),
    evidenceCodes: [
      "corp_turn_planner_shadow_only",
      "shadow_result_never_controls_live_action",
      "bounded_single_step_baseline_compared",
      `coverage_status:${params.coverage.status}`,
      `coverage_percent:${params.coverage.coveragePercent}`,
      ...params.search.evidenceCodes,
      ...params.enumerationIssues.map(
        (issue) => `enumeration_issue:${issue.moduleId}:${issue.code}`,
      ),
    ],
  };
}

function fallbackLine(
  input: AiDecisionInput,
  stateIdentity: PlanningStateIdentity,
  liveActionId: string,
  heads: readonly TurnPlanningHeadCandidate[],
): TurnRemainderSearchLine {
  const head =
    heads.find(
      (candidate) => candidate.currentBinding.actionId === liveActionId,
    ) ?? heads[0];
  const frame = buildProjectedDecisionFrame({
    input,
    rulesContext: (input as PlanningInput).planningRulesContext!,
    stateIdentity,
    turnKey: `corp:turn:${input.playerView.turnSerial ?? "unknown"}`,
  });
  return {
    lineId: turnPlanningFingerprint("shadow-empty-line", {
      stateIdentity,
      liveActionId,
    }),
    partitionKey: "shadow-empty",
    obligationSignature: "shadow-empty",
    rootPlanInstanceId: head?.rootPlanInstanceId ?? "shadow:no-root",
    nextMilestoneId: head?.nextMilestoneId ?? "shadow:no-milestone",
    steps: head
      ? [
          {
            candidateId: head.candidateId,
            invocation: structuredClone(head.invocation),
            rootPlanInstanceId: head.rootPlanInstanceId,
            nextMilestoneId: head.nextMilestoneId,
            currentBinding: structuredClone(head.currentBinding),
          },
        ]
      : [],
    projectedFrame: frame,
    evaluationValues: {},
    priorityCoverage: {
      requiredObligationIds: [],
      satisfiedObligationIds: [],
      violatedObligationIds: [],
      deferredObligationIds: [],
    },
    valueClaims: [],
    scalarValue: 0,
    upperBoundValue: 0,
    stopReason: "search_complete",
    evidenceCodes: ["shadow_no_search_line"],
  };
}

function debugPhases(
  line: TurnRemainderSearchLine,
  heads: readonly TurnPlanningHeadCandidate[],
  portfolio: Extract<PlanSchedulerResult, { lane: "plan" }>["portfolio"],
  entryFrameKey: string,
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): AiTurnPlanningDebug["selectedLine"]["phases"] {
  const groups: Array<{
    rootPlanInstanceId: string;
    steps: TurnRemainderSearchLine["steps"];
  }> = [];
  for (const step of line.steps) {
    const current = groups.at(-1);
    if (current?.rootPlanInstanceId === step.rootPlanInstanceId) {
      current.steps.push(step);
    } else {
      groups.push({
        rootPlanInstanceId: step.rootPlanInstanceId,
        steps: [step],
      });
    }
  }
  return groups.map((group, phaseIndex) => {
    const firstHead = heads.find(
      (head) => head.candidateId === group.steps[0]?.candidateId,
    );
    const leafInstances = group.steps
      .map((step) =>
        heads.find((head) => head.candidateId === step.candidateId),
      )
      .filter((head): head is TurnPlanningHeadCandidate => head !== undefined)
      .map((head) =>
        portfolio.instances.find(
          (instance) =>
            instance.moduleId === head.moduleId &&
            findRootPlanInstanceId(instance.instanceId, portfolio) ===
              group.rootPlanInstanceId,
        ),
      )
      .filter(
        (instance): instance is NonNullable<typeof instance> =>
          instance !== undefined,
      );
    const supportBindings = leafInstances.flatMap((instance) =>
      instance.parentNeedId
        ? [
            {
              planInstanceId: instance.instanceId,
              parentNeedId: instance.parentNeedId,
              assignmentId: turnPlanningFingerprint(
                "shadow-support-assignment",
                {
                  planInstanceId: instance.instanceId,
                  parentNeedId: instance.parentNeedId,
                  lineId: line.lineId,
                },
              ),
            },
          ]
        : [],
    );
    const phaseId = turnPlanningFingerprint("shadow-turn-phase", {
      lineId: line.lineId,
      phaseIndex,
      rootPlanInstanceId: group.rootPlanInstanceId,
      candidateIds: group.steps.map((step) => step.candidateId),
    });
    const rootModuleId =
      portfolio.instances.find(
        (instance) => instance.instanceId === group.rootPlanInstanceId,
      )?.moduleId ??
      firstHead?.moduleId ??
      "corp.complete_turn";
    return {
      phaseId,
      rootPlanInstanceId: group.rootPlanInstanceId,
      rootModuleId,
      rootProvenance: leafInstances.some(
        (instance) => instance.parentNeedId !== undefined,
      )
        ? "admitted_support"
        : "resident",
      entryFrameKey:
        phaseIndex === 0
          ? entryFrameKey
          : turnPlanningFingerprint("shadow-phase-entry", {
              lineId: line.lineId,
              phaseIndex,
            }),
      completionCode: firstHead?.nextMilestoneId ?? "shadow_no_milestone",
      transitionKind:
        phaseIndex < groups.length - 1
          ? "next_bound_phase"
          : debugStopReason(line),
      supportBindings,
      nodes: group.steps.map((step) => {
        const head = heads.find(
          (candidate) => candidate.candidateId === step.candidateId,
        );
        const candidate = candidates.find(
          (entry) => entry.actionId === head?.currentBinding.actionId,
        );
        const boundary = candidate
          ? boundaryForCandidate(input, candidate)
          : undefined;
        return {
          nodeId: turnPlanningFingerprint("shadow-turn-node", {
            lineId: line.lineId,
            candidateId: step.candidateId,
          }),
          semanticActionType: step.invocation.semanticActionType,
          ...(boundary ? { boundaryAfter: boundary.boundaryKind } : {}),
        };
      }),
    };
  });
}

function debugStopReason(
  line: TurnRemainderSearchLine,
): AiTurnPlanningDebug["selectedLine"]["stopReason"] {
  if (line.stopReason === "observation_boundary") return "observation_boundary";
  if (line.stopReason === "turn_capacity_exhausted")
    return "projected_turn_end";
  if (line.stopReason === "depth_limit") return "bounded_search_horizon";
  return "projection_not_supported";
}

function agendaDebug(
  slice: CorpAgendaTurnPlanningSlice,
): NonNullable<AiTurnPlanningDebug["agendaComparison"]> {
  return {
    opportunityKey: slice.opportunityKey,
    ...(slice.selectedFamily && slice.randomizationEligibility === undefined
      ? { selectedFamily: slice.selectedFamily }
      : {}),
    selectionReason:
      slice.randomizationEligibility !== undefined
        ? "engine_randomization_pending"
        : slice.selectionReason,
    randomizationEligible: slice.randomizationEligibility !== undefined,
    lines: slice.lines.map((line) => ({
      lineId: line.lineId,
      family: line.family,
      actionCount: line.nodes.length,
      agendaProgress: line.evaluation.agendaProgress,
      defense: line.evaluation.defense,
      economy: line.evaluation.economy,
      risk: line.evaluation.risk,
      worstCaseFloor: line.evaluation.worstCaseFloor,
      expectedValue: line.evaluation.expectedValue,
    })),
  };
}

function shadowComparisonClass(
  liveActionId: string,
  shadowHead: TurnPlanningHeadCandidate | undefined,
  greedyBaselineHead: TurnPlanningHeadCandidate | undefined,
):
  | "agreement"
  | "two_step_changes_head"
  | "different_current_head"
  | "no_shadow_line" {
  if (!shadowHead) return "no_shadow_line";
  if (shadowHead.currentBinding.actionId === liveActionId) return "agreement";
  if (
    greedyBaselineHead &&
    greedyBaselineHead.currentBinding.actionId !==
      shadowHead.currentBinding.actionId
  ) {
    return "two_step_changes_head";
  }
  return "different_current_head";
}

function findRootPlanInstanceId(
  instanceId: string,
  portfolio: Extract<PlanSchedulerResult, { lane: "plan" }>["portfolio"],
): string {
  let current = portfolio.instances.find(
    (instance) => instance.instanceId === instanceId,
  );
  const visited = new Set<string>();
  while (current?.parentInstanceId && !visited.has(current.parentInstanceId)) {
    visited.add(current.instanceId);
    const parent = portfolio.instances.find(
      (instance) => instance.instanceId === current!.parentInstanceId,
    );
    if (!parent) break;
    current = parent;
  }
  return current?.instanceId ?? instanceId;
}
