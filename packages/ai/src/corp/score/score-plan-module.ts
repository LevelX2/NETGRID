import type { AiDecisionInput } from "@netgrid/shared";
import {
  assessment,
  candidateTargetIds,
  domain,
  proposal,
  state,
} from "../../plans/corp-core-module-support";
import { ScoreState } from "../../plans/corp-core-plan-contracts";
import {
  CorpDefenseSignal,
  CorpGenericDefenseSignal,
} from "../../plans/corp-defense-contracts";
import {
  CorpScorePhase,
  CorpScoreProjectSignal,
} from "../../plans/corp-score-contracts";
import type { PlanAssessment } from "../../plans/plan-assessment";

import type { ResourceGap } from "../../plans/plan-assessment";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { PlanStepCapability } from "../../plans/plan-route";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import { corpScorePriorityClass } from "./corp-score-priority";
import { scoreInstallExposurePenalty } from "./score-route-risk";
export function scoreModule(): PlanModule {
  return {
    moduleId: "corp.score_agenda",
    side: "corp",
    discover: (context) =>
      domain(context).scoreProjects.map((signal) => {
        const resourceGaps = scoreResourceGaps(context, signal);
        const routeExists =
          resourceGaps.length === 0 &&
          signal.feasible &&
          scoreCandidates(context, signal).length > 0;
        return proposal({
          moduleId: "corp.score_agenda",
          dedupeKey: signal.projectId,
          moduleState: { kind: "score", signal } satisfies ScoreState,
          priorityClass: corpScorePriorityClass(signal),
          target: corpScorePlanTarget(signal),
          routeExists,
          supportable: resourceGaps.length > 0,
          evidenceCode: signal.evidenceCode,
          ...(!routeExists &&
          resourceGaps.length === 0 &&
          scoreBlockerCode(signal)
            ? { blockerCode: scoreBlockerCode(signal)! }
            : {}),
          abandonWhenTargetMissing: false,
          persistencePolicy:
            signal.sameTurnCloseout || signal.deadlinePressure
              ? "locked_sequence"
              : "sticky_goal",
        });
      }),
    assess: (instance, context, portfolio) => {
      const current = state<ScoreState>(instance);
      const resourceGaps = scoreResourceGaps(context, current.signal);
      const currentAssessment = assessment(
        instance,
        corpScorePriorityClass(current.signal),
        resourceGaps.length === 0 &&
          current.signal.feasible &&
          scoreCandidates(context, current.signal).length > 0,
        scoreAssessmentValue(
          current.signal,
          context.input.playerView.stateVersion,
        ),
        portfolio.executorInstanceId,
        resourceGaps,
      );
      return current.signal.phase === "select_agenda"
        ? {
            ...currentAssessment,
            intentFit: genericScoreMaterialIntentFit(context, current.signal),
          }
        : currentAssessment;
    },
    materialize: (instance, _assessment, context) => {
      const current = state<ScoreState>(instance);
      const nextCapability = nextScoreCapability(current.signal.phase);
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: scoreCapability(current.signal),
          ...(current.signal.actionIds
            ? {}
            : { target: corpScorePlanTarget(current.signal) }),
          purpose: current.signal.uncertainty
            ? `Execute the exact current score phase ${current.signal.phase}, then observe and revalidate the uncertain later score route.`
            : `Execute score phase ${current.signal.phase}.`,
        },
        candidates: scoreCandidates(context, current.signal),
        ...(current.signal.sameTurnCloseout &&
        !current.signal.actionIds &&
        nextCapability
          ? {
              continuation: {
                continuationId: `${instance.instanceId}:same-turn-score`,
                trigger: "action_applied" as const,
                nextCapability,
                ...(current.signal.agendaInstanceId
                  ? {
                      target: {
                        kind: "card" as const,
                        id: current.signal.agendaInstanceId,
                      },
                    }
                  : {}),
                purpose:
                  "Continue the protected same-turn score line after observing the new state.",
              },
            }
          : {}),
      };
    },
  };
}

function scoreAssessmentValue(
  signal: CorpScoreProjectSignal,
  stateVersion: number,
): number {
  const agendaPointValue = Math.max(1, signal.agendaPoints) * 20;
  const conversionValue = signal.conversion
    ? signal.conversion.realizedStrategySupportCount * 4 -
      signal.conversion.remainingAdvancementClicks * 8 -
      signal.conversion.remainingScoreCredits * 2 +
      (signal.conversion.residentParent ? 40 : 0)
    : 0;
  const routeValue =
    conversionValue - scoreInstallExposurePenalty(signal, stateVersion);
  if (signal.terminalScore) return 1_000 + agendaPointValue + routeValue;
  if (signal.preventsTerminalSteal)
    return 2_000 + agendaPointValue + routeValue;
  if (signal.deadlinePressure) return 700 + agendaPointValue + routeValue;
  if (signal.sameTurnCloseout) return 500 + agendaPointValue + routeValue;
  return 100 + agendaPointValue + routeValue;
}

function scoreBlockerCode(signal: CorpScoreProjectSignal): string | undefined {
  if (signal.feasible) return undefined;
  if ((signal.fundingGap ?? 0) > 0) return "corp_score_funding_route_required";
  if (
    signal.evidenceCode.startsWith("corp_current_turn_scoreline_unreachable:")
  )
    return "corp_score_deadline_route_unavailable";
  if (signal.evidenceCode.startsWith("corp_last_click_score_install_deferred:"))
    return "corp_score_development_click_unavailable";
  return "corp_score_route_unavailable";
}

function scoreCapability(signal: CorpScoreProjectSignal): PlanStepCapability {
  if (signal.phase === "recover_score_support")
    return {
      capabilityId: "recover_score_support",
      semanticActionTypes: signal.routeSemanticActionTypes ?? [],
    };
  if (signal.phase === "select_agenda")
    return {
      capabilityId: "select_score_agenda_material",
      semanticActionTypes: [],
    };
  if (signal.phase === "unlock_remote_creation")
    return {
      capabilityId: "unlock_score_remote_creation",
      semanticActionTypes: ["card_ability.trigger"],
    };
  if (
    signal.phase === "install_counter_bank" ||
    signal.phase === "install_agenda_from_counter_bank"
  )
    return {
      capabilityId:
        signal.phase === "install_counter_bank"
          ? "install_score_counter_bank"
          : "install_counter_bank_score_agenda",
      semanticActionTypes: ["install.card"],
      ...(signal.phase === "install_counter_bank" && signal.counterBank
        ? {
            requiredSourceDefinitionIds: [
              signal.counterBank.sourceDefinitionId,
            ],
          }
        : signal.agendaDefinitionId
          ? { requiredSourceDefinitionIds: [signal.agendaDefinitionId] }
          : {}),
    };
  if (signal.phase === "advance_counter_bank")
    return {
      capabilityId: "advance_score_counter_bank",
      semanticActionTypes: ["score.advance_card"],
    };
  if (
    signal.phase === "rez_counter_bank_for_handoff" ||
    signal.phase === "rez_counter_bank_for_liquidation"
  )
    return {
      capabilityId:
        signal.phase === "rez_counter_bank_for_handoff"
          ? "rez_counter_bank_for_score_handoff"
          : "rez_counter_bank_for_liquidation",
      semanticActionTypes: ["corp_window.rez"],
    };
  if (signal.phase === "liquidate_counter_bank")
    return {
      capabilityId: "liquidate_score_counter_bank",
      semanticActionTypes: ["economy.gain_credit"],
    };
  if (signal.phase === "convert_agenda")
    return {
      capabilityId: "convert_score_agenda",
      semanticActionTypes: signal.routeSemanticActionTypes ?? [
        "play.corp_operation",
      ],
    };
  if (signal.phase === "install_agenda")
    return {
      capabilityId: "install_score_agenda",
      semanticActionTypes: ["install.card"],
      ...(signal.agendaDefinitionId
        ? { requiredSourceDefinitionIds: [signal.agendaDefinitionId] }
        : {}),
    };
  if (signal.phase === "advance_agenda")
    return {
      capabilityId: "advance_score_agenda",
      semanticActionTypes: ["score.advance_card"],
    };
  return {
    capabilityId: "score_agenda",
    semanticActionTypes: ["score.agenda"],
  };
}

function nextScoreCapability(
  phase: CorpScorePhase,
): PlanStepCapability | undefined {
  if (phase === "unlock_remote_creation")
    return {
      capabilityId: "install_unlocked_score_agenda",
      semanticActionTypes: ["install.card"],
    };
  if (phase === "install_agenda")
    return {
      capabilityId: "advance_installed_agenda",
      semanticActionTypes: ["score.advance_card"],
    };
  if (phase === "install_agenda_from_counter_bank")
    return {
      capabilityId: "rez_or_transfer_counter_bank_to_installed_agenda",
      semanticActionTypes: [
        "corp_window.rez",
        "score_conversion.move_advancement",
      ],
    };
  if (phase === "advance_agenda")
    return {
      capabilityId: "score_advanced_agenda",
      semanticActionTypes: ["score.agenda"],
    };
  return undefined;
}

export function corpScorePlanTarget(signal: CorpScoreProjectSignal) {
  if (signal.phase === "select_agenda")
    return {
      kind: "capability" as const,
      id: `score-material:${signal.projectId}`,
    };
  if (signal.actionIds)
    return {
      kind: "capability" as const,
      id: "rules_legal_score_action",
    };
  return signal.phase === "install_agenda" ||
    signal.phase === "install_agenda_from_counter_bank"
    ? {
        kind: "card" as const,
        id: signal.agendaDefinitionId ?? signal.projectId,
      }
    : {
        kind: "card" as const,
        id:
          signal.agendaInstanceId ??
          signal.agendaDefinitionId ??
          signal.projectId,
      };
}

function scoreCandidates(
  context: PlanSchedulerContext,
  signal: CorpScoreProjectSignal,
): PlanMaterialization["candidates"] {
  if (signal.phase === "select_agenda") return [];
  if (
    signal.sameTurnFundingActionIds !== undefined &&
    (signal.fundingMilestone?.remainingGap ?? signal.fundingGap ?? 0) > 0
  )
    return [];
  const semantic = scoreCapability(signal).semanticActionTypes;
  return context.actionCandidates
    .filter((candidate) => {
      if (
        signal.actionIds !== undefined &&
        !signal.actionIds.includes(candidate.actionId)
      )
        return false;
      if (!semantic.includes(candidate.semanticActionType)) return false;
      if (
        (signal.phase === "convert_agenda" ||
          signal.phase === "recover_score_support") &&
        signal.actionIds?.includes(candidate.actionId) === true
      ) {
        return true;
      }
      if (signal.phase === "unlock_remote_creation") return true;
      if (
        signal.phase === "install_counter_bank" &&
        signal.counterBank !== undefined
      )
        return (
          candidate.sourceCardInstanceId ===
            signal.counterBank.sourceCardInstanceId &&
          candidate.sourceDefinitionId ===
            signal.counterBank.sourceDefinitionId &&
          candidateTargetIds(candidate).includes(signal.counterBank.serverId)
        );
      if (
        signal.phase === "install_agenda" ||
        signal.phase === "install_agenda_from_counter_bank"
      )
        return (
          signal.agendaDefinitionId !== undefined &&
          candidate.sourceDefinitionId === signal.agendaDefinitionId &&
          (!signal.serverId ||
            candidateTargetIds(candidate).includes(signal.serverId))
        );
      if (
        (signal.phase === "advance_counter_bank" ||
          signal.phase === "rez_counter_bank_for_handoff" ||
          signal.phase === "rez_counter_bank_for_liquidation" ||
          signal.phase === "liquidate_counter_bank") &&
        signal.counterBank !== undefined
      ) {
        return (
          candidate.sourceCardInstanceId ===
            signal.counterBank.sourceCardInstanceId &&
          candidate.sourceDefinitionId === signal.counterBank.sourceDefinitionId
        );
      }
      const agendaId = signal.agendaInstanceId ?? signal.agendaDefinitionId;
      if (!agendaId) return false;
      return (
        candidate.sourceCardInstanceId === agendaId ||
        candidateTargetIds(candidate).includes(agendaId)
      );
    })
    .map((candidate) => ({ candidate, stepValue: 100 }));
}

function scoreResourceGaps(
  context: PlanSchedulerContext,
  signal: CorpScoreProjectSignal,
): ResourceGap[] {
  const resourceGaps: ResourceGap[] = [];
  if (signal.phase === "select_agenda") {
    resourceGaps.push({
      needId: `score-material:${signal.projectId}`,
      capability: "draw_score_agenda_material",
      minimum: 1,
      available: 0,
      deadline: "multi_turn",
    });
  }
  if (signal.setupNeed) {
    const expectedNeedId = `score-setup:${signal.projectId}:${signal.setupNeed.sourceCardInstanceId}`;
    if (
      signal.phase === "select_agenda" ||
      signal.setupNeed.needId !== expectedNeedId ||
      !signal.setupNeed.actionId.trim() ||
      !signal.setupNeed.sourceDefinitionId.trim()
    ) {
      throw new PlanResolutionFailure("invalid_support_graph", {
        side: context.input.side,
        stateVersion: context.input.playerView.stateVersion,
        timingPoint: context.input.playerView.timingPoint,
        legalActionTypes: context.input.legalActions.map(
          (action) => action.type,
        ),
        unresolvedActionIds: signal.setupNeed.actionId
          ? [signal.setupNeed.actionId]
          : [],
        owner: "support_graph",
        planInstanceId: planInstanceIdForProposal({
          moduleId: "corp.score_agenda",
          dedupeKey: signal.projectId,
        }),
        removalCondition:
          "Bind score-acceleration setup only to the exact concrete score parent, exact current setup action, and stable source-scoped need.",
      });
    }
    resourceGaps.push({
      needId: signal.setupNeed.needId,
      capability: "install_score_acceleration_support",
      minimum: 1,
      available: 0,
      deadline: "multi_turn",
    });
  }
  const fundingGap = signal.fundingMilestone?.remainingGap ?? signal.fundingGap;
  if (
    signal.fundingMilestone &&
    (signal.fundingMilestone.observedCredits !==
      context.input.playerView.own.credits ||
      signal.fundingMilestone.remainingGap !==
        Math.max(
          0,
          signal.fundingMilestone.targetCredits -
            signal.fundingMilestone.observedCredits,
        ) ||
      signal.fundingMilestone.priorityClass !==
        corpScorePriorityClass(signal) ||
      (signal.fundingMilestone.basis.kind === "score_protection_gap" &&
        (signal.fundingMilestone.basis.needId !==
          signal.protectionNeed?.needId ||
          signal.fundingMilestone.basis.observedAtStateVersion !==
            context.input.playerView.stateVersion)))
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: signal.actionIds ?? [],
      owner: "support_graph",
      planInstanceId: planInstanceIdForProposal({
        moduleId: "corp.score_agenda",
        dedupeKey: signal.projectId,
      }),
      removalCondition:
        "Publish the score credit milestone from the exact current score parent and current Corp credit state.",
    });
  }
  const knownProtectionFundingGap =
    signal.protectionNeed?.baseline.knowledge === "known"
      ? (signal.protectionNeed.baseline.minimumAdditionalCreditsToSatisfy ?? 0)
      : 0;
  const hasExactCurrentAdvanceHead =
    signal.phase === "advance_agenda" &&
    signal.feasible &&
    (fundingGap ?? 0) === 0 &&
    knownProtectionFundingGap === 0 &&
    scoreCandidates(context, signal).length > 0;
  const hasExactCurrentScopedInstallHead =
    signal.phase === "install_agenda" &&
    signal.sameTurnFundingActionIds === undefined &&
    signal.feasible &&
    signal.uncertainty?.currentActionScope === "exact_install_only" &&
    scoreCandidates(context, signal).length > 0;
  if (
    !hasExactCurrentAdvanceHead &&
    !hasExactCurrentScopedInstallHead &&
    typeof fundingGap === "number" &&
    Number.isSafeInteger(fundingGap) &&
    fundingGap > 0
  ) {
    resourceGaps.push({
      needId: `score-support:${signal.projectId}`,
      capability: "credits",
      minimum: fundingGap,
      available: 0,
      deadline: signal.sameTurnCloseout ? "current_turn" : "multi_turn",
    });
  }
  const protectionProvider = domain(context).defenseNeeds.find(
    (
      defense,
    ): defense is Exclude<CorpDefenseSignal, CorpGenericDefenseSignal> =>
      defense.kind !== "generic" &&
      defense.parentProjectId === signal.projectId,
  );
  if (!protectionProvider) return resourceGaps;
  const protectionNeed = signal.protectionNeed;
  if (
    !protectionNeed ||
    protectionNeed.parentProjectId !== signal.projectId ||
    protectionNeed.targetServerId !== protectionProvider.serverId ||
    protectionNeed.observedAtStateVersion !==
      context.input.playerView.stateVersion
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: [protectionProvider.actionId],
      owner: "support_graph",
      planInstanceId: planInstanceIdForProposal({
        moduleId: "corp.score_agenda",
        dedupeKey: signal.projectId,
      }),
      removalCondition:
        "Bind score-protection support only to the exact current Engine-assessed protection need of its resident score parent.",
    });
  }
  resourceGaps.push({
    needId: protectionNeed.needId,
    capability: "protect_parent_target",
    minimum: 1,
    available: 0,
    deadline: signal.sameTurnCloseout ? "current_turn" : "multi_turn",
  });
  return resourceGaps;
}

function genericScoreMaterialIntentFit(
  context: PlanSchedulerContext,
  signal: CorpScoreProjectSignal,
): PlanAssessment["intentFit"] {
  const strategicIntent = (
    context.input as AiDecisionInput & {
      ownStrategicIntentState?: {
        side?: unknown;
        primaryStrategy?: { family?: unknown };
      };
    }
  ).ownStrategicIntentState;
  if (
    strategicIntent?.side === "corp" &&
    (strategicIntent.primaryStrategy?.family === "corp_scoreline" ||
      strategicIntent.primaryStrategy?.family === "corp_fast_advance")
  ) {
    return "aligned";
  }
  const exactTarget = corpScorePlanTarget(signal);
  const exactTacticalEvidence = context.transientSignals?.some(
    (transientSignal) =>
      transientSignal.signalId === `corp-score-material:${signal.projectId}` &&
      transientSignal.side === "corp" &&
      transientSignal.observedAtStateVersion ===
        context.input.playerView.stateVersion &&
      transientSignal.planModuleId === "corp.score_agenda" &&
      transientSignal.planDedupeKey === signal.projectId &&
      transientSignal.kind === "goal" &&
      transientSignal.scope === "tactical" &&
      transientSignal.evidenceCode ===
        "corp_score_campaign_missing_agenda_material" &&
      transientSignal.target?.kind === exactTarget.kind &&
      transientSignal.target.id === exactTarget.id,
  );
  return exactTacticalEvidence ? "tactical_override" : "none";
}
