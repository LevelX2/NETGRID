import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { punishCampaignModule } from "../corp/punish/punish-campaign-plan-module";
import { corpPunishCampaignOwnsCandidate } from "../corp/punish/punish-plan-support";
import { punishSequenceModule } from "../corp/punish/punish-sequence-plan-module";
import { createCorpVirusPressureModule } from "../corp/virus-pressure/virus-pressure-plan-module";
import {
  corpTacticalAssessment as assessment,
  corpSpecialDevelopmentAdmission,
  domain,
  corpTacticalProposal as proposal,
  state,
} from "./corp-tactical-module-support";
import {
  CorpAmbushSignal,
  CorpHandManagementSignal,
  CorpPlanDomain,
} from "./corp-tactical-plan-contracts";
import type { ResourceGap } from "./plan-assessment";
import { planInstanceIdForProposal } from "./plan-instance";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";

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
