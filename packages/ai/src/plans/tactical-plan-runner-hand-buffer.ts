import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";
import { runnerRunTargetHighPayoff } from "../runner-run-target-guidance";
import {
  assessRunnerDrawOverflow,
  runnerDrawOverflowEvidence,
  runnerDrawOverflowRationale,
} from "./runner-draw-overflow";
import {
  legalActionCreditGainForPlan,
  type TacticalPlanCreditValueDependencies,
} from "./tactical-plan-action-values";
import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import { actionServerId, isRemoteServer } from "./tactical-plan-server-targets";
import { runnerMeaningfulRunOpportunityAvailable } from "./tactical-plan-runner-support-actions";
import type {
  TacticalPlan,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

export function applyRunnerDrawOverflowAdjustments(
  context: TacticalPlanBuildContext,
  plans: readonly TacticalPlan[],
): TacticalPlan[] {
  return plans.map((plan) => {
    if (!runnerPlanUsesGenericDraw(plan)) return plan;
    const assessment = assessRunnerDrawOverflow(context, plan);
    if (!assessment || assessment.severity === "none") return plan;
    const evidence = runnerDrawOverflowEvidence(assessment);
    const adjustedPriority = Math.max(0, plan.priority - assessment.penalty);
    return {
      ...plan,
      priority: adjustedPriority,
      currentStep: {
        ...plan.currentStep,
        rationale: [
          ...plan.currentStep.rationale,
          ...runnerDrawOverflowRationale(assessment),
        ],
      },
      evidence: [...plan.evidence, ...evidence],
      scoreBreakdown: [
        ...plan.scoreBreakdown,
        {
          key: "runner_draw_overflow",
          label: "Runner draw overflow",
          value: -assessment.penalty,
          reason: assessment.severity,
        },
      ],
    };
  });
}

export function runnerHasNonBasicHandBufferAlternative(
  input: AiDecisionInput,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.side === "runner" &&
      action.source !== "basic_action" &&
      (action.type === "play_event" ||
        action.type === "trigger_ability" ||
        action.type === "activated_card_ability" ||
        action.type === "install_card"),
  );
}

export function runnerHandBufferAssessment(input: AiDecisionInput): {
  active: boolean;
  handCount: number;
  damagePressure: boolean;
  flatlineRiskLevel: ReturnType<
    typeof runnerDamageThreatAssessment
  >["flatlineRisk"]["level"];
  recommendedHandFloor: number;
  effectiveMaxHandSize: number;
  handBufferHeadroom: number;
  planPriority: number;
  reason: string;
  evidence: string[];
} {
  const handCount = input.playerView.own.gripOrHq.length;
  const flatlineRisk = runnerDamageThreatAssessment(input).flatlineRisk;
  const damagePressure = flatlineRisk.level !== "none";
  const active =
    flatlineRisk.handBufferHeadroom > 0 &&
    (handCount <= 1 ||
      (damagePressure && handCount < flatlineRisk.recommendedHandFloor));
  const planPriority =
    flatlineRisk.level === "critical"
      ? handCount <= 0
        ? 1720
        : 1560
      : flatlineRisk.level === "confirmed"
        ? handCount <= 1
          ? 1460
          : 1240
        : flatlineRisk.level === "suspected"
          ? handCount < flatlineRisk.recommendedHandFloor
            ? 1080
            : 0
          : handCount <= 0
            ? 1220
            : handCount === 1
              ? 1060
              : 0;
  const reason =
    flatlineRisk.level === "critical"
      ? "critical_damage_survival"
      : damagePressure && handCount < flatlineRisk.recommendedHandFloor
        ? "low_hand_damage_threat"
        : handCount <= 0
          ? "empty_hand"
          : "low_hand";
  return {
    active,
    handCount,
    damagePressure,
    flatlineRiskLevel: flatlineRisk.level,
    recommendedHandFloor: flatlineRisk.recommendedHandFloor,
    effectiveMaxHandSize: flatlineRisk.effectiveMaxHandSize,
    handBufferHeadroom: flatlineRisk.handBufferHeadroom,
    planPriority,
    reason,
    evidence: [
      `runner_hand_buffer_count:${handCount}`,
      `runner_hand_buffer_damage_pressure:${damagePressure}`,
      `runner_hand_buffer_flatline_risk:${flatlineRisk.level}`,
      `runner_hand_buffer_floor:${flatlineRisk.recommendedHandFloor}`,
      `runner_hand_buffer_effective_max:${flatlineRisk.effectiveMaxHandSize}`,
      `runner_hand_buffer_headroom:${flatlineRisk.handBufferHeadroom}`,
      `runner_hand_buffer_reason:${reason}`,
      ...flatlineRisk.evidence,
    ],
  };
}

export function runnerEconomyActionPreferredOverHandBuffer(
  context: TacticalPlanBuildContext,
  dependencies: TacticalPlanCreditValueDependencies,
): boolean {
  return context.input.legalActions.some(
    (action) =>
      legalActionCreditGainForPlan(context.input, action, dependencies) > 0,
  );
}

export function runnerHandBufferPlans(
  context: TacticalPlanBuildContext,
  stateVersion: number,
  runnerGoalEvidence: readonly string[],
  dependencies: TacticalPlanCreditValueDependencies,
): TacticalPlan[] {
  const hasSurvivalAction = context.input.legalActions.some((action) =>
    [
      "draw_card",
      "gain_credit",
      "install_card",
      "play_event",
      "trigger_ability",
      "activated_card_ability",
    ].includes(action.type),
  );
  if (!hasSurvivalAction) {
    return [];
  }
  const assessment = runnerHandBufferAssessment(context.input);
  if (
    !assessment.damagePressure &&
    runnerHasNonBasicHandBufferAlternative(context.input)
  ) {
    return [];
  }
  if (!assessment.active) return [];
  if (
    assessment.flatlineRiskLevel === "confirmed" &&
    assessment.handCount >= 2 &&
    runnerLargeLiquidityActionCanRestoreReactionFloor(context, dependencies)
  ) {
    return [];
  }
  if (
    !assessment.damagePressure &&
    runnerMeaningfulRunOpportunityAvailable(context)
  ) {
    return [];
  }
  if (
    !assessment.damagePressure &&
    runnerEconomyActionPreferredOverHandBuffer(context, dependencies)
  ) {
    return [];
  }
  if (
    assessment.flatlineRiskLevel !== "critical" &&
    runnerHighPayoffRunAvailable(context)
  ) {
    return [];
  }
  const survivalPlanActive = assessment.damagePressure;
  const planId = survivalPlanActive
    ? "runner.survival_defense"
    : "runner.restore_hand_buffer";
  const capabilityKind = survivalPlanActive ? "survival" : "hand_buffer";
  const capabilityId = survivalPlanActive
    ? "runner.survival_defense"
    : "runner.hand_buffer";
  const targetId = survivalPlanActive
    ? "runner_survival_defense"
    : "runner_hand_buffer";
  const stepKind = survivalPlanActive
    ? "find_survival_answer"
    : "draw_hand_buffer";
  const stepId = survivalPlanActive
    ? "find_survival_answer"
    : "draw_for_hand_buffer";
  return [
    createTacticalPlan({
      planId,
      side: "runner",
      type: survivalPlanActive
        ? "runner.survival_defense"
        : "runner.restore_hand_buffer",
      status: "active",
      priority: assessment.planPriority,
      horizonTurns: 1,
      target: { kind: "capability", id: targetId },
      requiredCapabilities: [
        {
          capabilityId,
          kind: capabilityKind,
          side: "runner",
          target: { kind: "capability", id: targetId },
          evidence: assessment.evidence,
        },
      ],
      currentStep: createPlanStep({
        stepId,
        kind: stepKind,
        desiredActionSemantics: survivalPlanActive
          ? [
              "draw.card",
              "damage.prevent",
              "flatline_prevention",
              "net_damage_prevention",
              "survival",
              "economy.gain_credit",
            ]
          : ["draw.card"],
        requiredCapabilities: [
          {
            capabilityId,
            kind: capabilityKind,
            side: "runner",
            target: { kind: "capability", id: targetId },
            evidence: assessment.evidence,
          },
        ],
        rationale: [
          survivalPlanActive
            ? "visible damage threat makes survival setup higher priority than pressure"
            : "runner hand buffer is too low for safe pressure",
          ...assessment.evidence,
        ],
      }),
      evidence: [...assessment.evidence, ...runnerGoalEvidence],
      scoreBreakdown: [
        {
          key: "runner_restore_hand_buffer",
          label: "Runner hand buffer",
          value: assessment.planPriority,
          reason: assessment.reason,
        },
      ],
      stateVersion,
    }),
  ];
}

function runnerLargeLiquidityActionCanRestoreReactionFloor(
  context: TacticalPlanBuildContext,
  dependencies: TacticalPlanCreditValueDependencies,
): boolean {
  if (context.input.playerView.own.credits >= 4) return false;
  return context.input.legalActions.some(
    (action) =>
      legalActionCreditGainForPlan(context.input, action, dependencies) >= 3,
  );
}

export function runnerHighPayoffRunAvailable(
  context: TacticalPlanBuildContext,
): boolean {
  if (
    (context.runnerRunTargetEvaluations ?? []).some(
      (evaluation) =>
        evaluation.pathPassability === "reachable" &&
        evaluation.creditsAfterRun >= 0 &&
        runnerRunTargetHighPayoff(evaluation),
    )
  ) {
    return true;
  }
  return context.input.legalActions.some((action) => {
    if (action.type !== "start_run") return false;
    const serverId = actionServerId(action);
    if (!serverId || !isRemoteServer(serverId)) return false;
    const server = context.input.playerView.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server) return false;
    return server.root.some(
      (card) =>
        card.known &&
        (card.type === "agenda" ||
          (card.advancementCounters ?? 0) > 0 ||
          remoteRootTrashCostForPlan(card) <=
            context.input.playerView.own.credits),
    );
  });
}

function runnerPlanUsesGenericDraw(plan: TacticalPlan): boolean {
  return plan.side === "runner" && plan.currentStep.kind === "draw_for_answer";
}

function remoteRootTrashCostForPlan(card: VisibleCard): number {
  if (card.type !== "asset" && card.type !== "upgrade") {
    return Number.POSITIVE_INFINITY;
  }
  return typeof card.trashCost === "number"
    ? card.trashCost
    : Number.POSITIVE_INFINITY;
}
