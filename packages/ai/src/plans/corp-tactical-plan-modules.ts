import { createCorpVirusPressureModule } from "../corp/virus-pressure/virus-pressure-plan-module";
import type { CorpVirusPressureSignal } from "../corp/virus-pressure/virus-pressure-types";
import {
  corpTacticalProposal as proposal,
  corpTacticalAssessment as assessment,
  corpTacticalPlanDomain,
} from "./corp-tactical-module-support";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { KnownCorpCardAccessEffectProjection } from "../runtime/known-corp-card-access-effect-projection";
import type { CorpHandInventoryFacts } from "../runtime/corp-hand-inventory-facts";
import type { CorpDrawAdmissionAssessment } from "../runtime/corp-draw-admission";
import type { GuaranteeLevel, ResourceGap } from "./plan-assessment";
import { planInstanceIdForProposal } from "./plan-instance";
import type { PlanInstance } from "./plan-kernel-types";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";
import type { CorpCorePlanDomain } from "./corp-core-plan-modules";

import type { CorpBluffDefenseNeed } from "./corp-bluff-defense-types";

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
    traceBidBinding?: {
      sourceCardInstanceId: string;
      sourceDefinitionId: string;
      quotedAtStateVersion: number;
      amount: number;
    };
  };
};

export type CorpAmbushSignal = {
  commitmentVersion: "corp_ambush_commitment_v1";
  ambushId: string;
  sourceDefinitionId: string;
  sourceInstanceId: string;
  actionIds: string[];
  serverId: string;
  phase:
    | "install"
    | "install_support"
    | "advance"
    | "rez_support"
    | "trigger_support"
    | "trigger"
    | "recycle"
    | "recycle_rd";
  patternKind?: "access_ambush" | "score_decoy" | "rd_recycle";
  recycleBluffUntilTurnSerial?: number;
  emptyRdRecovery?: { observedAtStateVersion: number };
  defenseNeed?: CorpBluffDefenseNeed;
  followupAgendaInstanceId?: string;
  runnerCreditsAtPlanStart?: number;
  purposeCode?: string;
  assignedDomainPlanIds: string[];
  duplicateAlreadyInstalled: boolean;
  affordableOrSupportable: boolean;
  plannedAtStateVersion: number;
  plannedAdvancementTarget: number;
  value: number;
  evidenceCode: string;
  decisionEvidenceCodes?: string[];
  runnerKnowledgeState?: "unknown" | "known_exact";
  bluffCompromised?: boolean;
  compromisedDisposition?:
    | "hold_known_threat"
    | "recycle_to_hq"
    | "trigger_on_access";
  accessThreatProjection?: KnownCorpCardAccessEffectProjection;
  accessPaymentChoiceBinding?: {
    actionId: string;
    choiceId: string;
    choiceSource: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    creditCost: number;
    noOpCertified: boolean;
  };
  accessProgramBounceChoiceBinding?: {
    actionId: string;
    choiceId: string;
    choiceSource: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    targetProgramInstanceIds: string[];
    evidenceCodes: string[];
  };
  recycleRoute?: {
    actionId: string;
    recyclerSourceInstanceId: string;
    recyclerSourceDefinitionId: string;
    targetCardInstanceId: string;
  };
  advancementSupportRoute?: {
    phase: "install" | "rez" | "trigger";
    actionId: string;
    supportSourceInstanceId: string;
    supportSourceDefinitionId: string;
    targetCardInstanceId: string;
    serverId: string;
    creditCost: number;
  };
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
    | "discard_window"
    | "draw_filter_window"
    | "hq_shuffle_window";
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
  discardChoiceBinding?: {
    actionId: string;
    choiceId: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    discardedCardInstanceIds: string[];
    retainedCardInstanceIds: string[];
    evidenceCodes: string[];
  };
  drawFilterChoiceBinding?: {
    actionId: string;
    choiceId: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    bottomedCardInstanceIds: string[];
    retainedCardInstanceIds: string[];
    evidenceCodes: string[];
  };
  hqShuffleChoiceBinding?: {
    actionId: string;
    choiceId: string;
    observedAtStateVersion: number;
    selectedOptionIds: string[];
    shuffledCardInstanceIds: string[];
    retainedCardInstanceIds: string[];
    evidenceCodes: string[];
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
  handInventoryFacts?: CorpHandInventoryFacts;
  drawArbitrations?: CorpDrawAdmissionAssessment[];
};

export type CorpPlanDomain = CorpCorePlanDomain & CorpTacticalPlanDomain;

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
    createCorpVirusPressureModule(),
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
        const priorityClass = ambushPriority(signal, context);
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
          signal.installRoute.fundingGap > 0 ||
          (signal.defenseNeed?.fundingGap ?? 0) > 0
        ) {
          return [rootProposal];
        }
        const setupNeedId = ambushSetupNeedId(signal);
        const setupPriority = ambushSetupPriority(signal, context);
        const setupProposal = proposal(
          "corp.ambush_and_bluff",
          `${signal.ambushId}:setup:${signal.serverId}`,
          { kind: "ambush_setup", signal } satisfies AmbushState,
          setupPriority,
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
          ambushSetupPriority(current.signal, context),
          ambushCandidates(context, current.signal).length > 0,
          current.signal.value,
          portfolio.executorInstanceId,
          currentEmptyRdRecovery(current.signal, context)
            ? "rules_proven"
            : "belief_supported",
        );
      }
      const resourceGaps = ambushRootResourceGaps(current.signal);
      const exactCurrentTrigger =
        (current.signal.phase === "trigger" ||
          current.signal.phase === "trigger_support" ||
          current.signal.phase === "rez_support") &&
        ambushCandidates(context, current.signal).length > 0;
      return assessment(
        instance,
        ambushPriority(current.signal, context),
        current.signal.phase !== "install" &&
          ambushCandidates(context, current.signal).length > 0,
        current.signal.value,
        portfolio.executorInstanceId,
        exactCurrentTrigger || currentEmptyRdRecovery(current.signal, context)
          ? "rules_proven"
          : "belief_supported",
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
              ? current.signal.patternKind === "score_decoy"
                ? "decoy_setup"
                : "ambush_setup"
              : `ambush_${current.signal.phase}`,
            semanticActionTypes: ambushSemanticTypes(current.signal.phase),
            ...(current.signal.accessProgramBounceChoiceBinding ||
            current.signal.accessPaymentChoiceBinding
              ? {}
              : {
                  requiredSourceDefinitionIds: current.signal
                    .advancementSupportRoute
                    ? [
                        current.signal.advancementSupportRoute
                          .supportSourceDefinitionId,
                      ]
                    : current.signal.phase === "recycle" &&
                        current.signal.recycleRoute
                      ? [current.signal.recycleRoute.recyclerSourceDefinitionId]
                      : [current.signal.sourceDefinitionId],
                }),
          },
          ...(current.signal.accessProgramBounceChoiceBinding ||
          current.signal.accessPaymentChoiceBinding
            ? {}
            : {
                target:
                  current.signal.phase === "install" ||
                  current.signal.phase === "install_support"
                    ? { kind: "server" as const, id: current.signal.serverId }
                    : (current.signal.phase === "rez_support" ||
                          current.signal.phase === "trigger_support") &&
                        current.signal.advancementSupportRoute
                      ? {
                          kind: "card" as const,
                          id: current.signal.advancementSupportRoute
                            .supportSourceInstanceId,
                        }
                      : {
                          kind: "card" as const,
                          id: current.signal.sourceInstanceId,
                        },
              }),
          purpose: `Execute admitted ambush purpose ${current.signal.purposeCode ?? "domain assigned"}.`,
        },
        candidates: ambushCandidates(context, current.signal),
      };
    },
  };
}

function currentEmptyRdRecovery(
  signal: CorpAmbushSignal,
  context: PlanSchedulerContext,
): boolean {
  return (
    signal.patternKind === "rd_recycle" &&
    signal.emptyRdRecovery?.observedAtStateVersion ===
      context.input.playerView.stateVersion &&
    context.input.playerView.own.stackOrRdCount === 0 &&
    signal.actionIds.some((id) =>
      context.input.legalActions.some(
        (action) =>
          action.actionId === id &&
          action.payload?.cardId === signal.sourceInstanceId &&
          action.expiresAtStateVersion ===
            context.input.playerView.stateVersion,
      ),
    )
  );
}

function ambushPriority(
  signal: CorpAmbushSignal,
  context: PlanSchedulerContext,
): "P2" | "P3" | "P4" | "P5" {
  if (currentEmptyRdRecovery(signal, context)) return "P2";
  if (signal.phase === "trigger" || signal.phase === "trigger_support")
    return "P3";
  if (signal.phase === "rez_support") return "P3";
  if (signal.phase === "install_support") return "P4";
  if (signal.phase === "recycle" || signal.phase === "recycle_rd") return "P4";
  if (signal.phase === "advance") return "P4";
  return "P5";
}

function ambushSetupPriority(
  signal: CorpAmbushSignal,
  context: PlanSchedulerContext,
): "P2" | "P4" | "P5" {
  if (currentEmptyRdRecovery(signal, context)) return "P2";
  return signal.patternKind === "score_decoy" ? "P4" : "P5";
}

function ambushRootResourceGaps(signal: CorpAmbushSignal): ResourceGap[] {
  if (signal.defenseNeed && signal.defenseNeed.fundingGap > 0) {
    return [
      {
        needId: `ambush-defense-funding:${signal.sourceInstanceId}`,
        capability: "credits",
        minimum: signal.defenseNeed.fundingGap,
        available: 0,
        deadline: "current_turn",
      },
    ];
  }
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
      deadline: signal.emptyRdRecovery ? "current_turn" : "multi_turn",
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
            corpHandPriorityClass(signal),
            handCandidates(context, signal),
            signal.evidenceCode,
            signal.sourceDefinitionIds?.[0]
              ? { kind: "card", id: signal.sourceDefinitionIds[0] }
              : { kind: "player", id: "corp" },
            signal.parentPlanInstanceId && signal.parentNeedId
              ? "flexible_support"
              : signal.phase === "discard_window" ||
                  signal.phase === "draw_filter_window" ||
                  signal.phase === "hq_shuffle_window"
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
        corpHandPriorityClass(current.signal),
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

function ambushSemanticTypes(phase: CorpAmbushSignal["phase"]): string[] {
  if (phase === "install" || phase === "install_support")
    return ["install.card"];
  if (phase === "advance") return ["score.advance_card"];
  if (phase === "recycle_rd") return ["corp_window.rez"];
  if (phase === "recycle") return ["corp_board.return_installed_card_to_hq"];
  if (phase === "rez_support") return ["corp_window.rez"];
  return ["corp_window.rez", "card_ability.trigger", "choice.resolve"];
}

function ambushCandidates(
  context: PlanSchedulerContext,
  signal: CorpAmbushSignal,
): PlanMaterialization["candidates"] {
  if (signal.phase === "install" && (signal.defenseNeed?.fundingGap ?? 0) > 0)
    return [];
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

export function corpHandPriorityClass(
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
  return corpTacticalPlanDomain<CorpPlanDomain>(context);
}

function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}
