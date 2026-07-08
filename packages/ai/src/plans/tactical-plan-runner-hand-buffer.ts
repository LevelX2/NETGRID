import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { runnerVisibleDamagePressure } from "../runner-visible-damage-pressure";
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
import {
  createPlanStep,
  createTacticalPlan,
} from "./tactical-plan-builders";
import {
  actionServerId,
  isRemoteServer,
} from "./tactical-plan-server-targets";
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
  planPriority: number;
  reason: string;
  evidence: string[];
} {
  const handCount = input.playerView.own.gripOrHq.length;
  const damagePressure = runnerVisibleDamagePressure(input);
  const active = handCount <= 1 || (damagePressure && handCount <= 2);
  const planPriority =
    handCount <= 0
      ? damagePressure
        ? 1280
        : 1220
      : handCount === 1
        ? damagePressure
          ? 1140
          : 1060
        : damagePressure
          ? 980
          : 0;
  const reason =
    handCount <= 0
      ? "empty_hand"
      : damagePressure
        ? "low_hand_damage_pressure"
        : "low_hand";
  return {
    active,
    handCount,
    damagePressure,
    planPriority,
    reason,
    evidence: [
      `runner_hand_buffer_count:${handCount}`,
      `runner_hand_buffer_damage_pressure:${damagePressure}`,
      `runner_hand_buffer_reason:${reason}`,
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
  if (!context.input.legalActions.some((action) => action.type === "draw_card")) {
    return [];
  }
  if (runnerHasNonBasicHandBufferAlternative(context.input)) return [];
  const assessment = runnerHandBufferAssessment(context.input);
  if (!assessment.active) return [];
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
  if (runnerHighPayoffRunAvailable(context)) return [];
  return [
    createTacticalPlan({
      planId: "runner.restore_hand_buffer",
      side: "runner",
      type: "runner.restore_hand_buffer",
      status: "active",
      priority: assessment.planPriority,
      horizonTurns: 1,
      target: { kind: "capability", id: "runner_hand_buffer" },
      requiredCapabilities: [
        {
          capabilityId: "runner.hand_buffer",
          kind: "hand_buffer",
          side: "runner",
          target: { kind: "capability", id: "runner_hand_buffer" },
          evidence: assessment.evidence,
        },
      ],
      currentStep: createPlanStep({
        stepId: "draw_for_hand_buffer",
        kind: "draw_hand_buffer",
        desiredActionSemantics: ["draw.card"],
        requiredCapabilities: [
          {
            capabilityId: "runner.hand_buffer",
            kind: "hand_buffer",
            side: "runner",
            target: { kind: "capability", id: "runner_hand_buffer" },
            evidence: assessment.evidence,
          },
        ],
        rationale: [
          "runner hand buffer is too low for safe pressure",
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

export function runnerHighPayoffRunAvailable(
  context: TacticalPlanBuildContext,
): boolean {
  if ((context.runnerRunTargetEvaluations ?? []).some(
    (evaluation) =>
      evaluation.pathPassability === "reachable" &&
      evaluation.creditsAfterRun >= 0 &&
      runnerRunTargetHighPayoff(evaluation),
  )) {
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
