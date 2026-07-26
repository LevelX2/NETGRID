import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  GuaranteeLevel,
  PlanAssessment,
  PriorityClass,
  PriorityClaim,
  ResourceGap,
} from "./plan-assessment";
import { planInstanceIdForProposal } from "./plan-instance";
import type { PlanInstance, PlanProposal } from "./plan-kernel-types";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";
import type { CorpCorePlanDomain } from "./corp-core-plan-modules";
import { PlanResolutionFailure } from "./plan-resolution-failure";

export type CorpVirusPressureSignal = {
  pressureId: string;
  virusCounters: number;
  strategicDamage: number;
  critical: boolean;
  purgeUseful: boolean;
  evidenceCode: string;
};

export type CorpPunishCampaignSignal = {
  campaignId: string;
  phase:
    | "prepare"
    | "watch_window"
    | "assemble_components"
    | "fund"
    | "trace"
    | "tag"
    | "damage"
    | "kill";
  sourceDefinitionIds: string[];
  actionIds?: string[];
  initiatingSemanticActionType?: string;
  feasible: boolean;
  guarantee: GuaranteeLevel;
  terminalCondition?: "runner_flatline" | "runner_deckout";
  visibleTerminalProjection: boolean;
  priorityClass?: "P4" | "P5";
  value: number;
  evidenceCode: string;
  evidenceCodes?: string[];
  routeContract?: {
    contractVersion: "corp_punish_route_signal_v1";
    quoteStatus: "complete" | "unknown";
    quoteStateVersion: number;
    routeId: string;
    totalClicks: number;
    totalActionCredits: number;
    corpResponseCredits: number;
    totalCorpCredits: number;
    fundingGap: number;
    fundingActionIds: string[];
    horizon: "execute" | "fund" | "wait";
    executionNeedId: string;
    fundingNeedId: string;
    currentHeadStepId?: string;
    currentHeadActionId?: string;
  };
};

export type CorpAmbushSignal = {
  commitmentVersion: "corp_ambush_commitment_v1";
  ambushId: string;
  sourceDefinitionId: string;
  sourceInstanceId: string;
  actionIds: string[];
  serverId: string;
  phase: "install" | "advance" | "trigger";
  purposeCode?: string;
  assignedDomainPlanIds: string[];
  duplicateAlreadyInstalled: boolean;
  affordableOrSupportable: boolean;
  plannedAtStateVersion: number;
  plannedAdvancementTarget: number;
  value: number;
  evidenceCode: string;
  installRoute?: {
    actionId: string;
    creditCost: number;
    fundingGap: number;
    costSource: "legal_action";
  };
};

export type CorpHandManagementSignal = {
  handPlanId: string;
  parentPlanInstanceId?: string;
  parentNeedId?: string;
  phase:
    | "draw_for_plan"
    | "develop_card"
    | "resolve_hq_overflow"
    | "agenda_flood_relief"
    | "discard_window";
  sourceDefinitionIds?: string[];
  sourceInstanceId?: string;
  actionIds?: string[];
  exactActionRoute?: boolean;
  agendaCount: number;
  handSize: number;
  maximumHandSize: number;
  concretePurposeCode: string;
  priorityClass?: "P3" | "P5" | "P6";
  routeAllowed?: boolean;
  uncertainty?: {
    kind: "draw_then_observe";
    unknownOutcome: "drawn_card_identity";
    revalidateAfterCurrentHead: true;
  };
  drawAttemptState?: {
    turnKey: string;
    remainingAttempts: 0 | 1;
    selectedAtStateVersion?: number;
  };
  overflowResolutionState?: {
    turnKey: string;
    initialOverflowCount: number;
    maximumConversions: number;
    remainingConversions: number;
    selectedAtStateVersion?: number;
    expectedOverflowAfterSelectedConversion?: number;
  };
  actionPriorityOrder?: string[];
  value: number;
  evidenceCode: string;
};

export type CorpTacticalPlanDomain = {
  virusPressure: CorpVirusPressureSignal[];
  punishCampaigns: CorpPunishCampaignSignal[];
  ambushes: CorpAmbushSignal[];
  handManagement: CorpHandManagementSignal[];
};

export type CorpPlanDomain = CorpCorePlanDomain & CorpTacticalPlanDomain;

type VirusState = { kind: "virus"; signal: CorpVirusPressureSignal };
type PunishState = {
  kind: "punish_campaign" | "punish_sequence";
  signal: CorpPunishCampaignSignal;
};
type AmbushState =
  | { kind: "ambush"; signal: CorpAmbushSignal }
  | { kind: "ambush_setup"; signal: CorpAmbushSignal };
type HandState = { kind: "hand"; signal: CorpHandManagementSignal };

export function createCorpTacticalPlanModules(): PlanModule[] {
  return [
    virusModule(),
    punishCampaignModule(),
    punishSequenceModule(),
    ambushModule(),
    handModule(),
  ];
}

export function corpSpecialDevelopmentAdmission(params: {
  assignedDomainPlanIds: readonly string[];
  concretePurposeCode?: string;
  duplicateAlreadyInstalled: boolean;
  affordableOrSupportable: boolean;
}):
  | { admitted: true; reasonCode: string }
  | { admitted: false; reasonCode: string } {
  if (params.duplicateAlreadyInstalled)
    return { admitted: false, reasonCode: "redundant_corp_copy" };
  if (!params.affordableOrSupportable)
    return { admitted: false, reasonCode: "unfunded_corp_development" };
  if (params.assignedDomainPlanIds.length > 0)
    return { admitted: true, reasonCode: "assigned_domain_plan" };
  if (!params.concretePurposeCode)
    return { admitted: false, reasonCode: "no_concrete_corp_purpose" };
  return {
    admitted: true,
    reasonCode: `specific_purpose:${params.concretePurposeCode}`,
  };
}

export function corpTacticalActionFamilyOwner(
  candidate: ActionSemanticCandidate,
  planDomain: CorpPlanDomain,
): PlanModule["moduleId"] | undefined {
  const punishCampaign = planDomain.punishCampaigns.find((signal) =>
    corpPunishCampaignOwnsCandidate(signal, candidate),
  );
  if (punishCampaign)
    return punishCampaign.routeContract
      ? "corp.execute_punish_sequence"
      : "corp.punish_campaign";
  if (
    candidate.semanticActionType === "counter.purge_virus" ||
    candidate.semanticActionType === "counter.purge_runner_virus"
  )
    return planDomain.virusPressure.some((signal) => signal.purgeUseful)
      ? "corp.respond_to_virus_pressure"
      : undefined;
  if (
    planDomain.ambushes.some((signal) =>
      signal.actionIds.includes(candidate.actionId),
    )
  )
    return "corp.ambush_and_bluff";
  const allowedHandPlans = planDomain.handManagement.filter(
    (signal) => signal.routeAllowed !== false,
  );
  if (candidate.semanticActionType === "choice.resolve")
    return allowedHandPlans.length > 0
      ? "corp.hand_and_agenda_management"
      : undefined;
  if (
    allowedHandPlans.some(
      (signal) => signal.actionIds?.includes(candidate.actionId) === true,
    )
  )
    return "corp.hand_and_agenda_management";
  return undefined;
}

export function corpPunishCampaignOwnsCandidate(
  signal: CorpPunishCampaignSignal,
  candidate: ActionSemanticCandidate,
): boolean {
  if (signal.routeContract) {
    return (
      signal.routeContract.quoteStatus === "complete" &&
      signal.routeContract.horizon === "execute" &&
      signal.routeContract.currentHeadActionId === candidate.actionId &&
      signal.feasible &&
      punishCapability(signal).semanticActionTypes.includes(
        candidate.semanticActionType,
      ) &&
      (signal.sourceDefinitionIds.length === 0 ||
        signal.sourceDefinitionIds.includes(candidate.sourceDefinitionId ?? ""))
    );
  }
  if (
    !signal.feasible ||
    (signal.actionIds !== undefined &&
      !signal.actionIds.includes(candidate.actionId)) ||
    !punishCapability(signal).semanticActionTypes.includes(
      candidate.semanticActionType,
    )
  ) {
    return false;
  }
  return (
    signal.sourceDefinitionIds.length === 0 ||
    candidate.semanticActionType === "choice.resolve" ||
    signal.sourceDefinitionIds.includes(candidate.sourceDefinitionId ?? "")
  );
}

function virusModule(): PlanModule {
  return {
    moduleId: "corp.respond_to_virus_pressure",
    side: "corp",
    discover: (context) =>
      domain(context)
        .virusPressure.filter(
          (signal) => signal.purgeUseful && signal.virusCounters > 0,
        )
        .map((signal) =>
          proposal(
            "corp.respond_to_virus_pressure",
            signal.pressureId,
            { kind: "virus", signal } satisfies VirusState,
            signal.critical ? "P2" : "P5",
            purgeCandidates(context),
            signal.evidenceCode,
            { kind: "capability", id: "runner_virus_pressure" },
            "recurring_cadence",
          ),
        ),
    assess: (instance, context, portfolio) => {
      const current = state<VirusState>(instance);
      return assessment(
        instance,
        current.signal.critical ? "P2" : "P5",
        purgeCandidates(context).length > 0,
        current.signal.strategicDamage,
        portfolio.executorInstanceId,
        "visible_state_forced",
      );
    },
    materialize: (instance, _assessment, context) => ({
      step: {
        stepId: `${instance.instanceId}:purge`,
        capability: {
          capabilityId: "purge_visible_runner_viruses",
          semanticActionTypes: [
            "counter.purge_virus",
            "counter.purge_runner_virus",
          ],
        },
        purpose: "Remove strategically material visible virus pressure.",
      },
      candidates: purgeCandidates(context),
    }),
  };
}

function punishCampaignModule(): PlanModule {
  return {
    moduleId: "corp.punish_campaign",
    side: "corp",
    discover: (context) =>
      domain(context).punishCampaigns.map((signal) =>
        proposal(
          "corp.punish_campaign",
          signal.campaignId,
          { kind: "punish_campaign", signal } satisfies PunishState,
          punishCampaignPriority(signal),
          signal.routeContract ? [] : punishCandidates(context, signal),
          signal.evidenceCodes ?? signal.evidenceCode,
          { kind: "player", id: "runner" },
          "sticky_goal",
          undefined,
          undefined,
          signal.routeContract?.quoteStatus === "unknown"
            ? "corp_punish_route_quote_unknown"
            : "no_current_tactical_route",
          punishRootResourceGaps(signal).length > 0,
        ),
      ),
    assess: (instance, context, portfolio) => {
      const current = state<PunishState>(instance);
      const routeExists =
        !current.signal.routeContract &&
        current.signal.feasible &&
        punishCandidates(context, current.signal).length > 0;
      return assessment(
        instance,
        punishCampaignPriority(current.signal),
        routeExists,
        current.signal.value,
        portfolio.executorInstanceId,
        current.signal.guarantee,
        current.signal.visibleTerminalProjection,
        punishRootResourceGaps(current.signal),
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<PunishState>(instance);
      return current.signal.routeContract
        ? {
            step: {
              stepId: `${instance.instanceId}:${current.signal.phase}`,
              capability: {
                capabilityId: "hold_punish_campaign",
                semanticActionTypes: [],
              },
              purpose:
                "Hold the quoted punish opportunity while its exact support or execution child acts.",
            },
            candidates: [],
          }
        : punishMaterialization(instance, context);
    },
  };
}

function punishCampaignPriority(
  signal: CorpPunishCampaignSignal,
): "P1" | "P3" | "P4" | "P5" {
  if (
    signal.routeContract &&
    signal.terminalCondition === "runner_flatline" &&
    signal.visibleTerminalProjection &&
    (signal.guarantee === "visible_state_forced" ||
      signal.guarantee === "robust_but_reactive") &&
    signal.routeContract.quoteStatus === "complete" &&
    signal.routeContract.horizon !== "wait"
  ) {
    return "P1";
  }
  return signal.priorityClass ?? "P4";
}

function punishSequenceModule(): PlanModule {
  return {
    moduleId: "corp.execute_punish_sequence",
    side: "corp",
    discover: (context) =>
      domain(context)
        .punishCampaigns.filter(
          (signal) =>
            signal.routeContract?.quoteStatus === "complete" &&
            signal.routeContract.horizon === "execute" &&
            signal.routeContract.currentHeadActionId !== undefined,
        )
        .map((signal) => {
          const executionProposal = proposal(
            "corp.execute_punish_sequence",
            `${signal.campaignId}:${signal.routeContract!.routeId}`,
            { kind: "punish_sequence", signal } satisfies PunishState,
            "P5",
            punishCandidates(context, signal),
            signal.evidenceCodes ?? signal.evidenceCode,
            { kind: "player", id: "runner" },
            "locked_sequence",
            planInstanceIdForProposal({
              moduleId: "corp.punish_campaign",
              dedupeKey: signal.campaignId,
            }),
            signal.routeContract!.executionNeedId,
          );
          executionProposal.retentionPolicy = {
            ...executionProposal.retentionPolicy,
            abandonWhenTargetMissing: true,
            protectedWhileNeedOpen: false,
            protectedWhileCommitted: false,
          };
          return executionProposal;
        }),
    assess: (instance, context, portfolio) => {
      const current = state<PunishState>(instance);
      return assessment(
        instance,
        "P5",
        current.signal.feasible &&
          punishCandidates(context, current.signal).length > 0,
        current.signal.value,
        portfolio.executorInstanceId,
        current.signal.guarantee,
        current.signal.visibleTerminalProjection,
      );
    },
    materialize: (instance, _assessment, context) =>
      punishMaterialization(instance, context),
  };
}

function punishMaterialization(
  instance: PlanInstance,
  context: PlanSchedulerContext,
): PlanMaterialization {
  const current = state<PunishState>(instance);
  const next = current.signal.routeContract
    ? undefined
    : punishNextCapability(current.signal.phase);
  return {
    step: {
      stepId: `${instance.instanceId}:${current.signal.phase}`,
      capability: punishCapability(current.signal),
      purpose: `Execute punish phase ${current.signal.phase}.`,
    },
    candidates: punishCandidates(context, current.signal),
    ...(next
      ? {
          continuation: {
            continuationId: `${instance.instanceId}:branch`,
            trigger: "outcome_observed" as const,
            nextCapability: next,
            target: { kind: "player" as const, id: "runner" },
            purpose:
              "Continue only after observing tag, prevention or damage outcome.",
          },
        }
      : {}),
  };
}

function punishRootResourceGaps(
  signal: CorpPunishCampaignSignal,
): ResourceGap[] {
  const route = signal.routeContract;
  if (!route || route.quoteStatus !== "complete") return [];
  if (route.horizon === "fund" && route.fundingGap > 0) {
    return [
      {
        needId: route.fundingNeedId,
        capability: "credits",
        minimum: route.fundingGap,
        available: 0,
        deadline: "current_turn",
      },
    ];
  }
  if (route.horizon === "execute" && route.currentHeadActionId) {
    return [
      {
        needId: route.executionNeedId,
        capability: "execute_complete_punish_route",
        minimum: 1,
        available: 0,
        deadline: "current_turn",
      },
    ];
  }
  return [];
}

function ambushModule(): PlanModule {
  return {
    moduleId: "corp.ambush_and_bluff",
    side: "corp",
    discover: (context) =>
      domain(context).ambushes.flatMap((signal) => {
        const admission = corpSpecialDevelopmentAdmission({
          assignedDomainPlanIds: signal.assignedDomainPlanIds,
          ...(signal.purposeCode
            ? { concretePurposeCode: signal.purposeCode }
            : {}),
          duplicateAlreadyInstalled: signal.duplicateAlreadyInstalled,
          affordableOrSupportable: signal.affordableOrSupportable,
        });
        if (!admission.admitted) return [];
        const priorityClass = ambushPriority(signal);
        const rootInstanceId = planInstanceIdForProposal({
          moduleId: "corp.ambush_and_bluff",
          dedupeKey: signal.ambushId,
        });
        const rootNeed = ambushRootResourceGaps(signal)[0];
        const rootProposal = proposal(
          "corp.ambush_and_bluff",
          signal.ambushId,
          { kind: "ambush", signal } satisfies AmbushState,
          priorityClass,
          signal.phase === "install" ? [] : ambushCandidates(context, signal),
          `${signal.evidenceCode}:${admission.reasonCode}`,
          { kind: "server", id: signal.serverId },
          "sticky_goal",
          undefined,
          undefined,
          signal.phase === "install" && !rootNeed
            ? "corp_ambush_install_route_quote_unknown"
            : "ambush_support_step_required",
          rootNeed !== undefined,
        );
        rootProposal.retentionPolicy = {
          ...rootProposal.retentionPolicy,
          abandonWhenTargetMissing: true,
          protectedWhileNeedOpen: false,
          protectedWhileCommitted: true,
        };
        if (
          signal.phase !== "install" ||
          !signal.installRoute ||
          signal.installRoute.fundingGap > 0
        ) {
          return [rootProposal];
        }
        const setupNeedId = ambushSetupNeedId(signal);
        const setupProposal = proposal(
          "corp.ambush_and_bluff",
          `${signal.ambushId}:setup:${signal.serverId}`,
          { kind: "ambush_setup", signal } satisfies AmbushState,
          "P5",
          ambushCandidates(context, signal),
          `${signal.evidenceCode}:${admission.reasonCode}`,
          { kind: "server", id: signal.serverId },
          "flexible_support",
          rootInstanceId,
          setupNeedId,
        );
        setupProposal.retentionPolicy = {
          ...setupProposal.retentionPolicy,
          abandonWhenTargetMissing: true,
          protectedWhileCommitted: false,
        };
        return [rootProposal, setupProposal];
      }),
    assess: (instance, context, portfolio) => {
      const current = state<AmbushState>(instance);
      if (current.kind === "ambush_setup") {
        return assessment(
          instance,
          "P5",
          ambushCandidates(context, current.signal).length > 0,
          current.signal.value,
          portfolio.executorInstanceId,
          "belief_supported",
        );
      }
      const resourceGaps = ambushRootResourceGaps(current.signal);
      return assessment(
        instance,
        ambushPriority(current.signal),
        current.signal.phase !== "install" &&
          ambushCandidates(context, current.signal).length > 0,
        current.signal.value,
        portfolio.executorInstanceId,
        "belief_supported",
        false,
        resourceGaps,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<AmbushState>(instance);
      const isSetup = current.kind === "ambush_setup";
      return {
        step: {
          stepId: `${instance.instanceId}:${
            isSetup ? "setup" : current.signal.phase
          }`,
          capability: {
            capabilityId: isSetup
              ? "ambush_setup"
              : `ambush_${current.signal.phase}`,
            semanticActionTypes: ambushSemanticTypes(current.signal.phase),
            requiredSourceDefinitionIds: [current.signal.sourceDefinitionId],
          },
          target:
            current.signal.phase === "install"
              ? { kind: "server", id: current.signal.serverId }
              : {
                  kind: "card",
                  id: current.signal.sourceInstanceId,
                },
          purpose: `Execute admitted ambush purpose ${current.signal.purposeCode ?? "domain assigned"}.`,
        },
        candidates: ambushCandidates(context, current.signal),
      };
    },
  };
}

function ambushPriority(signal: CorpAmbushSignal): "P3" | "P4" | "P5" {
  if (signal.phase === "trigger") return "P3";
  if (signal.phase === "advance") return "P4";
  return "P5";
}

function ambushRootResourceGaps(signal: CorpAmbushSignal): ResourceGap[] {
  if (signal.phase !== "install" || !signal.installRoute) return [];
  if (signal.installRoute.fundingGap > 0) {
    return [
      {
        needId: `ambush-funding:${signal.sourceInstanceId}`,
        capability: "credits",
        minimum: signal.installRoute.fundingGap,
        available: 0,
        deadline: "multi_turn",
      },
    ];
  }
  return [
    {
      needId: ambushSetupNeedId(signal),
      capability: "install_ambush_setup",
      minimum: 1,
      available: 0,
      deadline: "multi_turn",
    },
  ];
}

function ambushSetupNeedId(signal: CorpAmbushSignal): string {
  return `ambush-setup:${signal.sourceInstanceId}:${signal.serverId}`;
}

function handModule(): PlanModule {
  return {
    moduleId: "corp.hand_and_agenda_management",
    side: "corp",
    discover: (context) =>
      domain(context)
        .handManagement.filter(
          (signal) =>
            (signal.phase !== "draw_for_plan" &&
              signal.phase !== "develop_card") ||
            (signal.parentPlanInstanceId !== undefined &&
              signal.parentNeedId !== undefined),
        )
        .map((signal) =>
          proposal(
            "corp.hand_and_agenda_management",
            signal.handPlanId,
            { kind: "hand", signal } satisfies HandState,
            handPriority(signal),
            handCandidates(context, signal),
            signal.evidenceCode,
            signal.sourceDefinitionIds?.[0]
              ? { kind: "card", id: signal.sourceDefinitionIds[0] }
              : { kind: "player", id: "corp" },
            signal.parentPlanInstanceId && signal.parentNeedId
              ? "flexible_support"
              : signal.phase === "discard_window"
                ? "locked_sequence"
                : "sticky_goal",
            signal.parentPlanInstanceId,
            signal.parentNeedId,
          ),
        ),
    assess: (instance, context, portfolio) => {
      const current = state<HandState>(instance);
      return assessment(
        instance,
        handPriority(current.signal),
        handCandidates(context, current.signal).length > 0,
        current.signal.value,
        portfolio.executorInstanceId,
        "visible_state_forced",
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<HandState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: {
            capabilityId: current.signal.phase,
            semanticActionTypes: handStepSemanticTypes(context, current.signal),
            ...(current.signal.sourceDefinitionIds
              ? {
                  requiredSourceDefinitionIds:
                    current.signal.sourceDefinitionIds,
                }
              : {}),
          },
          purpose: current.signal.concretePurposeCode,
        },
        candidates: handCandidates(context, current.signal),
      };
    },
  };
}

function proposal(
  moduleId: PlanProposal["moduleId"],
  dedupeKey: string,
  moduleState: unknown,
  priorityClass: PriorityClass,
  candidates: PlanMaterialization["candidates"],
  evidenceCode: string | readonly string[],
  target: NonNullable<PlanProposal["target"]>,
  persistencePolicy: PlanProposal["persistencePolicy"],
  parentInstanceId?: string,
  parentNeedId?: string,
  blockerCode = "no_current_tactical_route",
  supportable = false,
): PlanProposal {
  const ready = candidates.length > 0;
  return {
    moduleId,
    moduleVersion: "1",
    dedupeKey,
    side: "corp",
    strategyLineIds: [],
    executionClass:
      priorityClass === "P1" || priorityClass === "P2"
        ? "urgent_response"
        : priorityClass === "P3"
          ? "bounded_sequence"
          : "development_project",
    initialViability: ready || supportable ? "ready" : "blocked",
    persistencePolicy,
    retentionPolicy: {
      blockedStateVersionTtl: 3,
      dormantStateVersionTtl: 4,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: false,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    target,
    ...(parentInstanceId ? { parentInstanceId } : {}),
    ...(parentNeedId ? { parentNeedId } : {}),
    phase: modulePhase(moduleState),
    milestone: "admitted",
    moduleState: structuredClone(moduleState),
    blockers:
      ready || supportable
        ? []
        : [
            {
              code: blockerCode,
              owner: "plan_module",
              removable: true,
              resumeCondition: { code: "route_becomes_available" },
            },
          ],
    resumeConditions: [{ code: "route_becomes_available" }],
    completionConditions: [{ code: "domain_goal_satisfied" }],
    abandonmentConditions: [{ code: "domain_invalidated" }],
    evidenceRefs: (typeof evidenceCode === "string"
      ? [evidenceCode]
      : evidenceCode
    ).map((code) => ({ code, source: "visible_state" as const })),
  };
}

function assessment(
  instance: PlanInstance,
  priorityClass: PriorityClass,
  routeExists: boolean,
  value: number,
  executorId: string | undefined,
  guarantee: GuaranteeLevel,
  terminalProjection = false,
  resourceGaps: readonly ResourceGap[] = [],
): PlanAssessment {
  const claim: PriorityClaim =
    priorityClass === "P1"
      ? {
          requestedClass: "P1",
          reasonCode: "terminal_win",
          horizon: "current_turn",
          witness: {
            kind: "terminal_path",
            evidenceCode: instance.evidenceRefs[0]?.code ?? "terminal",
            guarantee,
            target: { kind: "player", id: "runner" },
          },
        }
      : priorityClass === "P2"
        ? {
            requestedClass: "P2",
            reasonCode: "irreversible_threat",
            horizon: "current_turn",
            witness: {
              kind: "irreversible_threat",
              evidenceCode: instance.evidenceRefs[0]?.code ?? "threat",
              guarantee,
            },
          }
        : priorityClass === "P3"
          ? {
              requestedClass: "P3",
              reasonCode: "expiring_conversion",
              horizon: "current_window",
            }
          : priorityClass === "P4"
            ? {
                requestedClass: "P4",
                reasonCode: "strategic_campaign",
                horizon: "multi_turn",
              }
            : priorityClass === "P5"
              ? {
                  requestedClass: "P5",
                  reasonCode: "development_need",
                  horizon: "multi_turn",
                }
              : {
                  requestedClass: "P6",
                  reasonCode: "neutral_progress",
                  horizon: "multi_turn",
                };
  return {
    instanceId: instance.instanceId,
    side: "corp",
    priorityClaim: claim,
    intentFit:
      priorityClass === "P4" || priorityClass === "P5" ? "aligned" : "none",
    readiness: routeExists
      ? "executable_now"
      : resourceGaps.length > 0
        ? "executable_with_support"
        : "blocked",
    feasibility: {
      currentRouteHeadPossible: routeExists,
      projectedActionCount: routeExists
        ? 1
        : resourceGaps.length > 0
          ? resourceGaps.length + 1
          : 0,
      opponentCanReact: guarantee !== "rules_proven",
      confidence: guarantee,
    },
    resourceGaps: resourceGaps.map((gap) => ({ ...gap })),
    expectedOutcome: {
      outcomeKind: terminalProjection
        ? "terminal_projection"
        : "domain_progress",
      minimumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      expectedValue: routeExists || resourceGaps.length > 0 ? value : 0,
      maximumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      terminal: terminalProjection,
      guarantee,
    },
    continuity: {
      isCurrentForeground: executorId === instance.instanceId,
      sameObjectiveAsForeground: executorId === instance.instanceId,
      switchingCost: executorId === instance.instanceId ? 2 : 0,
      progressAtRisk: executorId === instance.instanceId ? 2 : 0,
    },
    blockers:
      routeExists || resourceGaps.length > 0
        ? []
        : structuredClone(instance.blockers),
    withinClassValue: value,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

function punishCapability(signal: CorpPunishCampaignSignal) {
  if (signal.routeContract?.currentHeadActionId) {
    return {
      capabilityId: `execute_punish_route:${signal.routeContract.routeId}:${signal.routeContract.currentHeadStepId ?? "head"}`,
      semanticActionTypes: signal.initiatingSemanticActionType
        ? [signal.initiatingSemanticActionType]
        : [],
      ...(signal.sourceDefinitionIds.length > 0
        ? { requiredSourceDefinitionIds: signal.sourceDefinitionIds }
        : {}),
    };
  }
  const phaseSemantic = {
    prepare: ["install.card", "corp_window.rez", "play.corp_operation"],
    watch_window: [],
    assemble_components: [],
    fund: ["economy.gain_credit"],
    trace: ["trace.initiate", "choice.resolve"],
    tag: ["tag.apply", "choice.resolve"],
    damage: ["damage.net", "damage.meat", "choice.resolve"],
    kill: ["damage.net", "damage.meat"],
  }[signal.phase];
  const semantic = [
    ...new Set([
      ...phaseSemantic,
      ...(signal.initiatingSemanticActionType
        ? [signal.initiatingSemanticActionType]
        : []),
    ]),
  ];
  return {
    capabilityId: `punish_${signal.phase}`,
    semanticActionTypes: semantic,
    ...(signal.sourceDefinitionIds.length > 0
      ? { requiredSourceDefinitionIds: signal.sourceDefinitionIds }
      : {}),
  };
}

function punishNextCapability(phase: CorpPunishCampaignSignal["phase"]) {
  if (phase === "trace")
    return {
      capabilityId: "resolve_trace_tag",
      semanticActionTypes: ["tag.apply", "choice.resolve"],
    };
  if (phase === "tag")
    return {
      capabilityId: "convert_tag_damage",
      semanticActionTypes: ["damage.net", "damage.meat"],
    };
  if (phase === "damage")
    return {
      capabilityId: "resolve_damage_outcome",
      semanticActionTypes: ["choice.resolve"],
    };
  return undefined;
}

function punishCandidates(
  context: PlanSchedulerContext,
  signal: CorpPunishCampaignSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter((candidate) => corpPunishCampaignOwnsCandidate(signal, candidate))
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.value +
        (signal.phase === "prepare"
          ? corpPrepareTargetValue(context, candidate)
          : 0),
    }));
}

function corpPrepareTargetValue(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
): number {
  if (candidate.semanticActionType !== "install.card") return 0;
  const target = candidateTargets(candidate).find(
    (targetId) => targetId === "new_remote" || targetId.startsWith("remote_"),
  );
  if (!target || target === "new_remote") return 0;
  const server = context.input.playerView.servers.find(
    (current) => current.id === target,
  );
  return (server?.ice.length ?? 0) > 0 ? 50 : 10;
}

function purgeCandidates(
  context: PlanSchedulerContext,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "counter.purge_virus" ||
        candidate.semanticActionType === "counter.purge_runner_virus",
    )
    .map((candidate) => ({ candidate, stepValue: 1 }));
}

function ambushSemanticTypes(phase: CorpAmbushSignal["phase"]): string[] {
  if (phase === "install") return ["install.card"];
  if (phase === "advance") return ["score.advance_card"];
  return ["corp_window.rez", "card_ability.trigger"];
}

function ambushCandidates(
  context: PlanSchedulerContext,
  signal: CorpAmbushSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter((candidate) => signal.actionIds.includes(candidate.actionId))
    .map((candidate) => ({ candidate, stepValue: signal.value }));
}

function handSemanticTypes(phase: CorpHandManagementSignal["phase"]): string[] {
  if (phase === "draw_for_plan")
    return ["draw.card", "play.corp_operation", "card_ability.trigger"];
  if (phase === "develop_card")
    return [
      "install.card",
      "play.corp_operation",
      "card_ability.trigger",
      "economy.gain_credit",
      "draw.card",
    ];
  if (phase === "resolve_hq_overflow")
    return ["install.card", "play.corp_operation"];
  return ["choice.resolve", "play.corp_operation"];
}

function handCandidates(
  context: PlanSchedulerContext,
  signal: CorpHandManagementSignal,
): PlanMaterialization["candidates"] {
  if (
    signal.routeAllowed === false ||
    (signal.phase === "resolve_hq_overflow" &&
      signal.overflowResolutionState?.remainingConversions !== undefined &&
      signal.overflowResolutionState.remainingConversions <= 0)
  )
    return [];
  return context.actionCandidates
    .filter((candidate) => {
      const exactProjectedDrawRoute =
        signal.phase === "draw_for_plan" &&
        signal.actionIds?.includes(candidate.actionId) === true &&
        (candidate.economyProjection?.cardsDrawn ?? 0) > 0;
      const exactActionRoute =
        signal.exactActionRoute === true &&
        signal.actionIds?.includes(candidate.actionId) === true;
      return (
        (handSemanticTypes(signal.phase).includes(
          candidate.semanticActionType,
        ) ||
          exactProjectedDrawRoute ||
          exactActionRoute) &&
        (!signal.actionIds || signal.actionIds.includes(candidate.actionId)) &&
        (!signal.sourceDefinitionIds ||
          (candidate.sourceDefinitionId !== undefined &&
            signal.sourceDefinitionIds.includes(
              candidate.sourceDefinitionId,
            ))) &&
        (!signal.sourceInstanceId ||
          candidate.sourceCardInstanceId === signal.sourceInstanceId)
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.value +
        (signal.phase === "resolve_hq_overflow"
          ? (() => {
              const priorityIndex =
                signal.actionPriorityOrder?.indexOf(candidate.actionId) ?? -1;
              return priorityIndex >= 0
                ? (signal.actionPriorityOrder?.length ?? 0) - priorityIndex
                : 0;
            })()
          : 0) +
        (signal.phase === "draw_for_plan"
          ? Math.max(0, candidate.economyProjection?.cardsDrawn ?? 0) * 10 +
            Math.max(0, candidate.economyProjection?.netLiquidCreditGain ?? 0) *
              5
          : 0),
    }));
}

function handStepSemanticTypes(
  context: PlanSchedulerContext,
  signal: CorpHandManagementSignal,
): string[] {
  const semanticActionTypes = handSemanticTypes(signal.phase);
  if (
    (signal.phase !== "draw_for_plan" && signal.exactActionRoute !== true) ||
    !signal.actionIds
  ) {
    return semanticActionTypes;
  }
  const exactProjectedDrawTypes = context.actionCandidates
    .filter(
      (candidate) =>
        signal.actionIds?.includes(candidate.actionId) === true &&
        (signal.exactActionRoute === true ||
          (candidate.economyProjection?.cardsDrawn ?? 0) > 0),
    )
    .map((candidate) => candidate.semanticActionType);
  return [...new Set([...semanticActionTypes, ...exactProjectedDrawTypes])];
}

function handPriority(
  signal: CorpHandManagementSignal,
): "P2" | "P3" | "P5" | "P6" {
  if (signal.phase === "agenda_flood_relief") return "P2";
  if (signal.phase === "resolve_hq_overflow") return "P5";
  return signal.priorityClass ?? "P5";
}

function candidateTargets(candidate: ActionSemanticCandidate): string[] {
  return [
    ...(candidate.targetContext?.selectedTargets.map(
      (target) => target.targetId,
    ) ?? []),
    ...(candidate.targetContext?.availableTargets?.map(
      (target) => target.targetId,
    ) ?? []),
    ...(candidate.runProjectionSummary?.serverId
      ? [candidate.runProjectionSummary.serverId]
      : []),
  ];
}

function domain(context: PlanSchedulerContext): CorpPlanDomain {
  const value = context.domain as CorpPlanDomain | undefined;
  if (
    value?.virusPressure &&
    value.punishCampaigns &&
    value.ambushes &&
    value.handManagement
  )
    return value;
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "Build the Corp tactical domain before discovering tactical plans.",
  });
}

function modulePhase(moduleState: unknown): string {
  const value = moduleState as Partial<
    VirusState | PunishState | AmbushState | HandState
  >;
  if ("signal" in value && value.signal && "phase" in value.signal)
    return String(value.signal.phase);
  return value.kind ?? "execute";
}

function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}
