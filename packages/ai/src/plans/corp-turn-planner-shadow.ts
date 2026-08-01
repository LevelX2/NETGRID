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
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import {
  enumerateCurrentPlanSchedulerRoutes,
  type PlanActionDisposition,
  type PlanSchedulerContext,
  type PlanSchedulerPlanningRouteCandidate,
  type PlanSchedulerResult,
  type SidePlanRegistry,
} from "./plan-scheduler";
import {
  compareValidatedPlanAssessments,
  type PriorityClass,
  type ValidatedPlanAssessment,
} from "./plan-assessment";
import type { PlanRouteStep, SemanticContinuation } from "./plan-route";
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
  requiredTargetIds?: string[];
  nextMilestoneId: string;
  instanceHorizon: "current_turn" | "multi_turn";
  campaignQuote?: CampaignMilestoneQuote;
  evaluationValues: Record<string, number>;
  valueClaims: CampaignValueClaim[];
  evidenceCodes: string[];
  variantKey: string;
  priorityClass?: PriorityClass;
};

export type CorpTurnPlannerShadowResult = {
  schemaVersion: typeof CORP_TURN_PLANNER_SHADOW_SCHEMA_VERSION;
  debug: AiTurnPlanningDebug;
  coverage: CorpTurnPlanningCoverageReport;
  liveActionId: string;
  shadowActionId?: string;
  agreement: boolean;
  heads: TurnPlanningHeadCandidate[];
  selectedLine?: TurnRemainderSearchLine;
  selectedHead?: TurnPlanningHeadCandidate;
  selectedPlanInstanceId?: string;
  headBindings: Array<{
    candidateId: string;
    planInstanceId: string;
    assessment: ValidatedPlanAssessment;
    step: PlanRouteStep;
    continuation?: SemanticContinuation;
  }>;
};

export function buildCorpTurnPlannerShadow(params: {
  input: AiDecisionInput;
  context: PlanSchedulerContext;
  registry: SidePlanRegistry;
  runtimeResult: Extract<PlanSchedulerResult, { lane: "plan" }>;
  selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
    currentPortfolio?: ResidentPlanPortfolio,
  ) => AiDecision["selectedChoices"] | undefined;
  authorityMode?: "shadow" | "cutover";
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
  const rawHeadRecords = planningRoutes.flatMap((route) =>
    headsForRoute({
      input,
      stateIdentity,
      route,
      portfolio: params.runtimeResult.portfolio,
      agendaSlices,
      defenseSlice,
      selectedChoicesForDecision: params.selectedChoicesForDecision,
    }).map((head) => ({ head, route })),
  );
  const deduplicatedHeadRecords = [
    ...rawHeadRecords
      .sort(
        (left, right) =>
          compareValidatedPlanAssessments(
            left.route.assessment,
            right.route.assessment,
          ) || left.head.candidateId.localeCompare(right.head.candidateId),
      )
      .reduce((records, record) => {
        const key = [
          record.head.rootPlanInstanceId,
          record.head.moduleId,
          record.head.nextMilestoneId,
          record.head.invocation.invocationKey,
          record.head.currentBinding.actionId,
        ].join(":");
        if (!records.has(key)) records.set(key, record);
        return records;
      }, new Map<string, (typeof rawHeadRecords)[number]>())
      .values(),
  ];
  const authoritativeModuleByActionId = new Map<string, PlanModuleId>();
  for (const record of deduplicatedHeadRecords) {
    if (
      !authoritativeModuleByActionId.has(record.head.currentBinding.actionId)
    ) {
      authoritativeModuleByActionId.set(
        record.head.currentBinding.actionId,
        record.head.moduleId,
      );
    }
  }
  const headRecords = deduplicatedHeadRecords.filter(
    (record) =>
      authoritativeModuleByActionId.get(record.head.currentBinding.actionId) ===
      record.head.moduleId,
  );
  const heads = headRecords.map((record) => record.head);
  const coverageDispositions = dispositionsForUnmaterializedSpecializedLines({
    existing: params.context.actionDispositions ?? [],
    heads,
    agendaSlices,
    defenseSlice,
    domain,
    candidates: params.context.actionCandidates,
  });
  const preferredRootCandidateIds = selectedAgendaHeadCandidateIds(
    headRecords,
    agendaSlices,
  );
  for (const head of heads) {
    if (
      head.currentBinding.actionId === params.runtimeResult.route.head.actionId
    ) {
      preferredRootCandidateIds.add(head.candidateId);
    }
  }
  const coverage = buildCorpTurnPlanningCoverageReport({
    input,
    stateIdentity,
    candidates: params.context.actionCandidates,
    heads,
    dispositions: coverageDispositions,
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
    preferredRootCandidateIds,
    moduleSelectedActionId: params.runtimeResult.route.head.actionId,
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
  const selectedSearchLine = search.lines.find(
    (line) => line.lineId === search.selectedLineId,
  );
  const plannerBaselineRecord = [...headRecords].sort(
    (left, right) =>
      compareValidatedPlanAssessments(
        left.route.assessment,
        right.route.assessment,
      ) ||
      right.route.stepValue - left.route.stepValue ||
      left.head.candidateId.localeCompare(right.head.candidateId),
  )[0];
  const liveActionId = params.runtimeResult.route.head.actionId;
  const selectedLine =
    selectedSearchLine ??
    fallbackLine(
      input,
      stateIdentity,
      plannerBaselineRecord?.head.currentBinding.actionId ?? liveActionId,
      heads,
    );
  const shadowHead = selectedLine?.steps[0]
    ? heads.find(
        (head) => head.candidateId === selectedLine.steps[0]!.candidateId,
      )
    : undefined;
  const selectedPlanInstanceId = shadowHead
    ? headRecords.find(
        (record) => record.head.candidateId === shadowHead.candidateId,
      )?.route.instance.instanceId
    : undefined;
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
    authorityMode: params.authorityMode ?? "shadow",
  });
  return {
    schemaVersion: CORP_TURN_PLANNER_SHADOW_SCHEMA_VERSION,
    debug,
    coverage,
    liveActionId,
    ...(shadowActionId ? { shadowActionId } : {}),
    agreement: shadowActionId === liveActionId,
    heads: structuredClone(heads),
    ...(selectedLine ? { selectedLine: structuredClone(selectedLine) } : {}),
    ...(shadowHead ? { selectedHead: structuredClone(shadowHead) } : {}),
    ...(selectedPlanInstanceId ? { selectedPlanInstanceId } : {}),
    headBindings: headRecords.map((record) => ({
      candidateId: record.head.candidateId,
      planInstanceId: record.route.instance.instanceId,
      assessment: structuredClone(record.route.assessment),
      step: structuredClone(record.route.step),
      ...(record.route.continuation
        ? { continuation: structuredClone(record.route.continuation) }
        : {}),
    })),
  };
}

function dispositionsForUnmaterializedSpecializedLines(params: {
  existing: readonly PlanActionDisposition[];
  heads: readonly TurnPlanningHeadCandidate[];
  agendaSlices: Array<{
    projectId: string;
    slice: CorpAgendaTurnPlanningSlice;
  }>;
  defenseSlice: CorpDefenseTurnPlanningSlice | undefined;
  domain: CorpPlanDomain | undefined;
  candidates: readonly ActionSemanticCandidate[];
}): PlanActionDisposition[] {
  const dispositions = params.existing.map((entry) => structuredClone(entry));
  const classifiedActionIds = new Set([
    ...dispositions.map((entry) => entry.actionId),
    ...params.heads.map((head) => head.currentBinding.actionId),
  ]);
  const specializedLines = [
    ...params.agendaSlices.flatMap(({ slice }) => slice.lines),
    ...(params.defenseSlice?.lines ?? []),
  ].sort(
    (left, right) =>
      left.currentActionId.localeCompare(right.currentActionId) ||
      left.lineId.localeCompare(right.lineId),
  );
  for (const line of specializedLines) {
    if (classifiedActionIds.has(line.currentActionId)) continue;
    const ownerModuleId = line.nodes[0]?.ownerModuleId;
    if (!ownerModuleId) continue;
    dispositions.push({
      actionId: line.currentActionId,
      disposition: "explicitly_nonproductive",
      ownerModuleId,
      evidenceCode: "turn_planning_specialized_line_provider_not_executable",
    });
    classifiedActionIds.add(line.currentActionId);
  }
  if (!params.domain) return dispositions;
  const addClaim = (
    actionId: string,
    ownerModuleId: PlanModuleId,
    evidenceCode: string,
  ): void => {
    if (!actionId || classifiedActionIds.has(actionId)) return;
    dispositions.push({
      actionId,
      disposition: "explicitly_nonproductive",
      ownerModuleId,
      evidenceCode: `turn_planning_domain_claim_provider_not_executable:${evidenceCode}`,
    });
    classifiedActionIds.add(actionId);
  };
  for (const signal of params.domain.scoreProjects) {
    for (const actionId of signal.actionIds ?? []) {
      addClaim(actionId, "corp.score_agenda", signal.evidenceCode);
    }
  }
  for (const signal of params.domain.defenseNeeds) {
    const actionIds =
      signal.kind === "generic" ? (signal.actionIds ?? []) : [signal.actionId];
    for (const actionId of actionIds) {
      addClaim(actionId, "corp.defend_servers", signal.evidenceCode);
    }
  }
  for (const signal of params.domain.economyNeeds) {
    for (const actionId of signal.actionIds) {
      addClaim(actionId, "corp.economy", signal.evidenceCode);
    }
  }
  for (const signal of params.domain.punishCampaigns) {
    for (const actionId of signal.actionIds ?? []) {
      addClaim(actionId, "corp.punish_campaign", signal.evidenceCode);
    }
    if (signal.routeContract?.currentHeadActionId) {
      addClaim(
        signal.routeContract.currentHeadActionId,
        "corp.execute_punish_sequence",
        signal.evidenceCode,
      );
    }
  }
  for (const signal of params.domain.ambushes) {
    for (const actionId of signal.actionIds) {
      addClaim(actionId, "corp.ambush_and_bluff", signal.evidenceCode);
    }
  }
  for (const signal of params.domain.handManagement) {
    const actionIds =
      signal.actionIds ??
      params.candidates
        .filter(
          (candidate) =>
            (!signal.sourceInstanceId ||
              candidate.sourceCardInstanceId === signal.sourceInstanceId) &&
            (!signal.sourceDefinitionIds ||
              signal.sourceDefinitionIds.includes(
                candidate.sourceDefinitionId ?? "",
              )),
        )
        .map((candidate) => candidate.actionId);
    for (const actionId of actionIds) {
      addClaim(
        actionId,
        "corp.hand_and_agenda_management",
        signal.evidenceCode,
      );
    }
  }
  return dispositions;
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
    exactPlanInstanceId?: string,
  ): void => {
    if (
      routes.some(
        (route) =>
          route.instance.moduleId === moduleId &&
          route.candidate.actionId === actionId &&
          (projectId === undefined || route.instance.dedupeKey === projectId) &&
          (exactPlanInstanceId === undefined ||
            route.instance.instanceId === exactPlanInstanceId),
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
        (projectId === undefined || route.instance.dedupeKey === projectId) &&
        (exactPlanInstanceId === undefined ||
          route.instance.instanceId === exactPlanInstanceId),
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
    const currentNode = line.nodes[0];
    const ownerModuleId = currentNode?.ownerModuleId;
    if (
      currentNode &&
      line.currentActionId &&
      (ownerModuleId === "corp.defend_servers" ||
        ownerModuleId === "corp.economy")
    ) {
      addRoute(
        line.currentActionId,
        ownerModuleId,
        undefined,
        currentNode.planInstanceId,
      );
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
    currentPortfolio?: ResidentPlanPortfolio,
  ) => AiDecision["selectedChoices"] | undefined;
}): TurnPlanningHeadCandidate[] {
  const action = params.input.legalActions.find(
    (candidate) => candidate.actionId === params.route.candidate.actionId,
  );
  const moduleCoverage = corpTurnPlanningModuleCoverage(
    params.route.instance.moduleId,
  );
  if (!action || !moduleCoverage) return [];
  const selectedChoices =
    planBoundCorpDefenseChoices(params.route, action, params.input) ??
    params.selectedChoicesForDecision(params.input, action, params.portfolio);
  const invocations = currentTurnPlanningInvocationVariants({
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
  const specializedActionOwned = specializedPlanningLineOwnsAction(
    action.actionId,
    params.agendaSlices,
    params.defenseSlice,
  );
  const variants =
    specialized.length > 0
      ? specialized.flatMap((variant) =>
          invocations
            .filter((invocation) =>
              invocationContainsRequiredTargets(
                invocation,
                variant.requiredTargetIds ?? [],
              ),
            )
            .map((invocation) => ({
              ...variant,
              invocation,
              variantKey: `${variant.variantKey}:${invocation.invocationKey}`,
            })),
        )
      : specializedActionOwned
        ? []
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
  const rootPlanModuleId =
    params.portfolio.instances.find(
      (instance) => instance.instanceId === rootPlanInstanceId,
    )?.moduleId ?? params.route.instance.moduleId;
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
      rootPlanModuleId,
      executorPlanInstanceId: params.route.instance.instanceId,
      ...(params.route.instance.parentInstanceId
        ? {
            executorParentPlanInstanceId:
              params.route.instance.parentInstanceId,
          }
        : {}),
      ...(params.route.instance.parentNeedId
        ? { executorParentNeedId: params.route.instance.parentNeedId }
        : {}),
      nextMilestoneId: variant.nextMilestoneId,
      stepFingerprint,
      horizonCapability: moduleCoverage.horizonCapability,
      instanceHorizon: variant.instanceHorizon,
      priorityClass:
        variant.priorityClass ??
        params.route.assessment.priorityValidation.effectiveClass,
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

function specializedPlanningLineOwnsAction(
  actionId: string,
  agendaSlices: Array<{
    projectId: string;
    slice: CorpAgendaTurnPlanningSlice;
  }>,
  defenseSlice: CorpDefenseTurnPlanningSlice | undefined,
): boolean {
  return (
    agendaSlices.some(({ slice }) =>
      slice.lines.some((line) => line.currentActionId === actionId),
    ) ||
    defenseSlice?.lines.some((line) => line.currentActionId === actionId) ===
      true
  );
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
            line.nodes[0]?.ownerModuleId === route.instance.moduleId &&
            (slice.selectedFamily === undefined ||
              line.family === slice.selectedFamily),
        )
        .map((line) => agendaVariant(line, route)) ?? []
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
            line.nodes[0]?.ownerModuleId === route.instance.moduleId &&
            line.nodes[0]?.planInstanceId === route.instance.instanceId,
        )
        .map((line) => defenseVariant(line, route)) ?? []
    );
  }
  return [];
}

function agendaVariant(
  line: CorpAgendaTurnPlanningLine,
  route: PlanSchedulerPlanningRouteCandidate,
): Omit<HeadVariant, "invocation"> {
  return {
    nextMilestoneId: line.campaignQuote.nextMilestoneId,
    instanceHorizon: "multi_turn",
    campaignQuote: structuredClone(line.campaignQuote),
    evaluationValues: {
      agenda_progress: boundedUtility(
        line.evaluation.agendaProgress + route.stepValue,
      ),
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
  route: PlanSchedulerPlanningRouteCandidate,
): Omit<HeadVariant, "invocation"> {
  const currentNode = line.nodes[0];
  return {
    ...(currentNode?.invocation.semanticActionType === "install.card"
      ? { requiredTargetIds: [line.targetServerId] }
      : {}),
    nextMilestoneId: line.campaignQuote.nextMilestoneId,
    instanceHorizon: "multi_turn",
    campaignQuote: structuredClone(line.campaignQuote),
    evaluationValues: {
      defense: boundedUtility(line.defenseValue + route.stepValue),
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
    ...(line.priorityClass ? { priorityClass: line.priorityClass } : {}),
  };
}

function invocationContainsRequiredTargets(
  invocation: CanonicalLegalActionInvocation,
  requiredTargetIds: readonly string[],
): boolean {
  if (requiredTargetIds.length === 0) return true;
  const boundTargetIds = new Set(
    invocation.boundTargets.flatMap((slot) =>
      slot.values.map((value) => value.id),
    ),
  );
  return requiredTargetIds.every((targetId) => boundTargetIds.has(targetId));
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

export function currentTurnPlanningInvocationVariants(params: {
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
  if (action.targetRequirements.length === 0) {
    const resolvedServerId = action.payload?.serverId;
    return typeof resolvedServerId === "string" && resolvedServerId.length > 0
      ? [
          [
            {
              slotId: "server",
              values: [{ kind: "server", id: resolvedServerId }],
              ordering: "single",
            },
          ],
        ]
      : [[]];
  }
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
          ? "capability"
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
    const value =
      selectedChoices.choiceId === requirement.choiceId &&
      Array.isArray(selectedChoices.selectedOptionIds)
        ? selectedChoices.selectedOptionIds
        : selectedChoices[requirement.choiceId];
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
  preferredRootCandidateIds: ReadonlySet<string>;
  moduleSelectedActionId: string;
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
      const boundary = boundaryForCandidate(params.input, candidate, head);
      const boundaryMustBeImmediate =
        boundary !== undefined &&
        head.moduleId === "corp.hand_and_agenda_management";
      return {
        head,
        candidate,
        rootPreferenceRank: params.preferredRootCandidateIds.has(
          head.candidateId,
        )
          ? 1
          : 0,
        moduleCandidatePreferenceRank:
          head.currentBinding.actionId === params.moduleSelectedActionId
            ? 1
            : 0,
        obligationSignature:
          priorityCoverage.requiredObligationIds.join(",") || "no_urgent",
        priorityCoverage,
        ...(dependencyCandidateIds.length > 0
          ? { dependencyCandidateIds, rootEligible: false }
          : {}),
        incompatibleCandidateIds: [
          ...new Set([
            ...(
              candidateIdsByActionId.get(head.currentBinding.actionId) ?? []
            ).filter((candidateId) => candidateId !== head.candidateId),
            ...(boundaryMustBeImmediate
              ? params.heads
                  .map((candidateHead) => candidateHead.candidateId)
                  .filter((candidateId) => candidateId !== head.candidateId)
              : []),
          ]),
        ].sort(),
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

function selectedAgendaHeadCandidateIds(
  records: readonly {
    head: TurnPlanningHeadCandidate;
    route: PlanSchedulerPlanningRouteCandidate;
  }[],
  slices: readonly {
    projectId: string;
    slice: CorpAgendaTurnPlanningSlice;
  }[],
): Set<string> {
  const selected = new Set<string>();
  for (const record of records) {
    const agenda = slices.find(
      ({ projectId }) => projectId === record.route.instance.dedupeKey,
    );
    const family = agenda?.slice.selectedFamily;
    if (
      family &&
      agenda.slice.opportunityKey.startsWith("opening-rush:") &&
      agenda.slice.lines.some(
        (line) =>
          line.family === family &&
          line.currentActionId === record.head.currentBinding.actionId,
      ) &&
      record.head.evidenceCodes.includes(`agenda_line_family:${family}`)
    ) {
      selected.add(record.head.candidateId);
    }
  }
  return selected;
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
  head?: TurnPlanningHeadCandidate,
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
    head?.moduleId === "corp.defend_servers" &&
    head.evidenceCodes.includes(
      "defense_progress_kind:score_material_capacity_release",
    )
  ) {
    return assessTurnObservationBoundary({
      boundaryKind: "projection_not_supported",
      remainingActionCapacity,
      residualTurnValueBasis: "remaining_capacity",
      immediateOutcomeCodes: ["score_material_draw_capacity_released"],
      uncertainty: [{ code: "post_capacity_release_draw_replanning_required" }],
      assumptionIds: ["score_material_capacity_release_route_executable"],
    });
  }
  if (
    head?.rootPlanInstanceId.startsWith(
      "plan:corp.economy:economy-visible-liquidity-development%3A",
    ) &&
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.sourceKind === "basic_action"
  ) {
    return assessTurnObservationBoundary({
      boundaryKind: "projection_not_supported",
      remainingActionCapacity,
      residualTurnValueBasis: "remaining_capacity",
      immediateOutcomeCodes: ["visible_liquidity_target_revalidated"],
      uncertainty: [{ code: "post_liquidity_target_replanning_required" }],
      assumptionIds: ["current_liquidity_development_route_executable"],
    });
  }
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
  authorityMode: "shadow" | "cutover";
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
    .map((step) => {
      const head = params.heads.find(
        (candidate) => candidate.candidateId === step.candidateId,
      );
      const candidate = params.candidates.find(
        (entry) => entry.actionId === head?.currentBinding.actionId,
      );
      return candidate
        ? boundaryForCandidate(params.input, candidate, head)
        : undefined;
    })
    .find(
      (boundary): boundary is BoundaryActionAssessment =>
        boundary !== undefined,
    );

  return {
    schemaVersion: AI_TURN_PLANNING_DEBUG_SCHEMA_VERSION,
    mode: params.authorityMode,
    stateVersion: params.stateIdentity.stateVersion,
    sideSafePlanningFingerprint:
      params.stateIdentity.sideSafePlanningFingerprint,
    planningRulesFingerprint: params.rulesContext.fingerprint,
    turnKey: `corp:turn:${params.input.playerView.turnSerial ?? "unknown"}`,
    heads: params.heads.map((head) => ({
      candidateId: head.candidateId,
      moduleId: head.moduleId,
      rootPlanInstanceId: head.rootPlanInstanceId,
      ...(head.executorPlanInstanceId
        ? { executorPlanInstanceId: head.executorPlanInstanceId }
        : {}),
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
            status:
              params.authorityMode === "cutover" ? "active" : "prospective",
            cursor: {
              phaseIndex: 0,
              nodeIndex: 0,
              phaseId: phases[0]?.phaseId ?? "shadow:no-phase",
              nodeId:
                phases[0]?.nodes[0]?.nodeId ?? selectedHead.stepFingerprint,
            },
            phaseEntry: {
              phaseId: phases[0]?.phaseId ?? "shadow:no-phase",
              status:
                params.authorityMode === "cutover"
                  ? "validated"
                  : "projection_only",
              reasonCode:
                params.authorityMode === "cutover"
                  ? "cutover_initial_phase_entry_validated"
                  : "shadow_never_executes",
            },
            rematerialization: {
              status:
                params.authorityMode === "cutover"
                  ? "executable"
                  : "not_attempted",
              ...(params.authorityMode === "cutover"
                ? {
                    actionId: selectedHead.currentBinding.actionId,
                    reasonCode: "cutover_current_head_rematerialized",
                  }
                : { reasonCode: "shadow_never_executes" }),
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
    ...(params.portfolio.campaigns?.length
      ? {
          campaigns: params.portfolio.campaigns.map((campaign) => ({
            campaignId: campaign.campaignId,
            kind: campaign.kind,
            status: campaign.status,
            rootPlanInstanceId: campaign.origin.rootPlanInstanceId,
            moduleId: campaign.origin.moduleId,
            milestoneId: campaign.milestoneId,
            ...(campaign.origin.targetServerId
              ? { targetServerId: campaign.origin.targetServerId }
              : {}),
            ...(campaign.origin.targetCardInstanceId
              ? { targetCardInstanceId: campaign.origin.targetCardInstanceId }
              : {}),
            ...(campaign.origin.openingRushOpportunityKey
              ? {
                  openingRushOpportunityKey:
                    campaign.origin.openingRushOpportunityKey,
                }
              : {}),
            requoteStatus: campaign.requote.status,
            requoteReasonCode: campaign.requote.reasonCode,
            reactionStatus: campaign.reaction.status,
            openReactionWindowKinds: [...campaign.reaction.openWindowKinds],
            reactionDeadline: campaign.reaction.deadline,
            claimDisposition: campaign.reaction.claimDisposition,
            reactionReasonCode: campaign.reaction.reasonCode,
            publicOutcomes: campaign.publicOutcomes.map((outcome) => ({
              outcomeId: outcome.outcomeId,
              eventId: outcome.eventId,
              eventType: outcome.eventType,
              stateVersionAfter: outcome.stateVersionAfter,
              kind: outcome.kind,
              milestoneId: outcome.milestoneId,
              origin: outcome.origin,
              ...(outcome.targetServerId
                ? { targetServerId: outcome.targetServerId }
                : {}),
              ...(outcome.targetCardInstanceId
                ? { targetCardInstanceId: outcome.targetCardInstanceId }
                : {}),
              evidenceCode: outcome.evidenceCode,
            })),
            evidenceCodes: [...campaign.evidenceCodes],
          })),
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
      steps: line.steps.map((step) => ({
        candidateId: step.candidateId,
        semanticActionType: step.invocation.semanticActionType,
        rootPlanInstanceId: step.rootPlanInstanceId,
        nextMilestoneId: step.nextMilestoneId,
        ...(step.currentBinding
          ? { currentActionId: step.currentBinding.actionId }
          : {}),
      })),
      evaluationValues: { ...line.evaluationValues },
      evidenceCodes: [...line.evidenceCodes],
    })),
    pruneEvents: params.search.pruneEvents.map((event) => ({
      candidateId: event.candidateId,
      reasonCode: event.reasonCode,
    })),
    evidenceCodes: [
      ...(params.authorityMode === "cutover"
        ? [
            "corp_turn_planner_cutover_authority",
            "legacy_single_action_selection_comparison_only",
          ]
        : [
            "corp_turn_planner_shadow_only",
            "shadow_result_never_controls_live_action",
          ]),
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
    priorityClass: head?.priorityClass ?? "P6",
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
    const phaseHeads = group.steps
      .map((step) =>
        heads.find((head) => head.candidateId === step.candidateId),
      )
      .filter((head): head is TurnPlanningHeadCandidate => head !== undefined);
    const supportBindings = phaseHeads.flatMap((head) =>
      head.executorPlanInstanceId && head.executorParentNeedId
        ? [
            {
              planInstanceId: head.executorPlanInstanceId,
              parentNeedId: head.executorParentNeedId,
              assignmentId: turnPlanningFingerprint(
                "shadow-support-assignment",
                {
                  planInstanceId: head.executorPlanInstanceId,
                  parentNeedId: head.executorParentNeedId,
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
      firstHead?.rootPlanModuleId ??
      portfolio.instances.find(
        (instance) => instance.instanceId === group.rootPlanInstanceId,
      )?.moduleId ??
      firstHead?.moduleId ??
      "corp.complete_turn";
    return {
      phaseId,
      rootPlanInstanceId: group.rootPlanInstanceId,
      rootModuleId,
      rootProvenance:
        supportBindings.length > 0 ? "admitted_support" : "resident",
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
          ? boundaryForCandidate(input, candidate, head)
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

function planBoundCorpDefenseChoices(
  route: PlanSchedulerPlanningRouteCandidate,
  action: LegalAction,
  input: AiDecisionInput,
): AiDecision["selectedChoices"] | undefined {
  if (
    route.instance.moduleId !== "corp.defend_servers" ||
    action.type !== "resolve_choice"
  ) {
    return undefined;
  }
  const moduleState = route.instance.moduleState as
    | {
        kind?: unknown;
        signals?: Array<{
          kind?: unknown;
          phase?: unknown;
          actionIds?: unknown;
          choiceResolution?: {
            kind?: unknown;
            choiceId?: unknown;
            sourceStateVersion?: unknown;
            targets?: Array<{ optionId?: unknown }>;
          };
        }>;
      }
    | undefined;
  const signal = moduleState?.signals?.find(
    (candidate) =>
      candidate.kind === "generic" &&
      candidate.phase === "resolve_install_targets" &&
      Array.isArray(candidate.actionIds) &&
      candidate.actionIds.length === 1 &&
      candidate.actionIds[0] === action.actionId &&
      candidate.choiceResolution?.kind === "agenda_purge_install_targets",
  );
  const resolution = signal?.choiceResolution;
  const targets = resolution?.targets;
  const requirement = action.choiceRequirements?.[0];
  const optionIds =
    targets?.map((target) =>
      typeof target.optionId === "string" ? target.optionId : "",
    ) ?? [];
  if (
    moduleState?.kind !== "defense" ||
    resolution?.sourceStateVersion !== input.playerView.stateVersion ||
    typeof resolution.choiceId !== "string" ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== resolution.choiceId ||
    !Array.isArray(targets) ||
    optionIds.length < requirement.minSelections ||
    optionIds.length > requirement.maxSelections ||
    new Set(optionIds).size !== optionIds.length ||
    optionIds.some((optionId) => !requirement.optionIds.includes(optionId))
  ) {
    return undefined;
  }
  return {
    choiceId: resolution.choiceId,
    selectedOptionIds: optionIds,
  };
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
