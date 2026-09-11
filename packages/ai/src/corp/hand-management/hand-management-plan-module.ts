import {
  corpTacticalAssessment as assessment,
  domain,
  corpTacticalProposal as proposal,
  state,
} from "../../plans/corp-tactical-module-support";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import { CorpHandManagementSignal } from "./hand-management-types";

export type HandState = { kind: "hand"; signal: CorpHandManagementSignal };

export function handModule(): PlanModule {
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

export function handSemanticTypes(
  phase: CorpHandManagementSignal["phase"],
): string[] {
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

export function handCandidates(
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

export function handStepSemanticTypes(
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
