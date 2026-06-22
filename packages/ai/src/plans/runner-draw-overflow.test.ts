import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";

import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import type { RunnerEconomyPosture } from "../runner-run-target-evaluation";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";
import {
  assessRunnerDrawOverflow,
  runnerDrawOverflowCreditPriorityBoost,
  runnerDrawOverflowEvidence,
  runnerDrawOverflowRationale,
  runnerDrawOverflowSupportsCreditPlan,
  runnerHandDevelopmentOverflowBonus,
} from "./runner-draw-overflow";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

describe("runner draw overflow planning", () => {
  it("assesses overdraw pressure with discard fodder and useful card risk", () => {
    const context = runnerContext({
      legalActions: [legalAction("draw-two", "draw_card", { amount: 2 })],
      hand: [
        visibleCard("low-a", "event"),
        visibleCard("useful-a", "program"),
        visibleCard("useful-b", "hardware"),
        visibleCard("filler-a", "event"),
        visibleCard("filler-b", "event"),
      ],
      handDevelopmentEvaluations: [
        handEvaluation("low-a", {
          developmentRole: "duplicate_or_low_value",
          strategicFit: "weak",
          currentNeed: "none",
          priority: 120,
          deferReason: "duplicate",
        }),
        handEvaluation("useful-a", {
          developmentRole: "breaker_or_rig_piece",
          currentNeed: "useful_now",
          priority: 800,
        }),
      ],
    });

    const assessment = assessRunnerDrawOverflow(context);

    expect(assessment).toMatchObject({
      cardsToDraw: 2,
      projectedOverflow: 2,
      severity: "moderate",
      discardFodderCount: 1,
      usefulPlayableCardsInHand: 1,
      penalty: 270,
    });
    expect(runnerDrawOverflowEvidence(assessment!)).toEqual(
      expect.arrayContaining([
        "hand_limit_pressure:moderate",
        "projected_overflow:2",
        "draw_overflow_penalty:270",
        "discard_fodder_count:1",
      ]),
    );
    expect(runnerDrawOverflowRationale(assessment!)).toEqual(
      expect.arrayContaining([
        "handLimitPressure:moderate",
        "projectedOverflow:2",
        "drawOverflowPenalty:270",
      ]),
    );
  });

  it("keeps urgent remote score-threat draw plausible", () => {
    const context = runnerContext({
      legalActions: [legalAction("draw", "draw_card")],
      hand: [
        visibleCard("low-a", "event"),
        visibleCard("setup-a", "program"),
        visibleCard("setup-b", "hardware"),
        visibleCard("setup-c", "event"),
        visibleCard("setup-d", "event"),
      ],
      servers: [
        server("remote_1", [], [
          visibleCard("agenda", "agenda", { owner: "corp", advancementCounters: 1 }),
        ]),
      ],
      tacticalGoals: [
        runnerTacticalGoal("runner.contest_remote_if_score_threat", {
          targetServerId: "remote_1",
        }),
      ],
    });
    const assessment = assessRunnerDrawOverflow(context, {
      target: { kind: "server", id: "remote_1" },
    } as Parameters<typeof assessRunnerDrawOverflow>[1]);

    expect(assessment).toMatchObject({
      projectedOverflow: 1,
      urgencyOverride: "find_breaker_for_score_threat",
      penalty: 0,
    });
    expect(assessment?.reasons).toEqual(
      expect.arrayContaining([
        "draw_still_plausible_under_urgency",
        "urgency_override_keeps_draw_plausible",
      ]),
    );
  });

  it("promotes credit plans when draw overflow would risk blocked useful cards", () => {
    const context = runnerContext({
      legalActions: [legalAction("draw", "draw_card"), legalAction("gain", "gain_credit")],
      hand: [
        visibleCard("expensive", "resource"),
        visibleCard("filler-a", "event"),
        visibleCard("filler-b", "event"),
        visibleCard("filler-c", "event"),
        visibleCard("filler-d", "event"),
      ],
      handDevelopmentEvaluations: [
        handEvaluation("expensive", {
          availability: "missing_credits",
          developmentRole: "economy_engine",
          currentNeed: "useful_now",
          priority: 700,
        }),
      ],
      economyPosture: runnerEconomyPosture({
        currentCredits: 1,
        usefulHandCardsBlockedByCredits: 1,
      }),
    });

    const assessment = assessRunnerDrawOverflow(context);

    expect(runnerDrawOverflowSupportsCreditPlan(assessment!)).toBe(true);
    expect(runnerDrawOverflowCreditPriorityBoost(assessment!)).toBe(105);
    expect(runnerHandDevelopmentOverflowBonus(assessment)).toBe(0);
  });
});

function runnerContext(params: {
  legalActions: LegalAction[];
  hand: VisibleCard[];
  handDevelopmentEvaluations?: RunnerHandDevelopmentEvaluation[];
  economyPosture?: RunnerEconomyPosture;
  tacticalGoals?: RunnerTacticalGoal[];
  servers?: PlayerView["servers"];
}): TacticalPlanBuildContext {
  const input = aiInput(params.legalActions);
  input.playerView.own.gripOrHq = params.hand;
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    ...(params.servers ?? []),
  ];
  return {
    input,
    ...(params.handDevelopmentEvaluations
      ? { runnerHandDevelopmentEvaluations: params.handDevelopmentEvaluations }
      : {}),
    ...(params.economyPosture ? { runnerEconomyPosture: params.economyPosture } : {}),
    ...(params.tacticalGoals ? { runnerTacticalGoals: params.tacticalGoals } : {}),
  };
}

function aiInput(legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: "runner",
    playerView: playerView(legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "runner-draw-overflow-test",
    decisionId: "runner-draw-overflow-test",
    actionNumber: 1,
    profileId: "runner-draw-overflow-test",
  };
}

function playerView(legalActions: LegalAction[]): PlayerView {
  return {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 0,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ credits: 0 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    ...(Object.keys(payload).length > 0 ? { payload } : {}),
  };
}

function visibleCard(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  const side = overrides.owner ?? "runner";
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    owner: side,
    controller: side,
    type,
    known: true,
    ...overrides,
  };
}

function visibleIdentity(side: Side): PlayerView["own"]["identity"] {
  return visibleCard(`${side}-identity`, "identity", { owner: side, controller: side });
}

function server(
  id: PlayerView["servers"][number]["id"],
  ice: VisibleCard[] = [],
  root: VisibleCard[] = [],
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root,
  };
}

function handEvaluation(
  cardInstanceId: string,
  overrides: Partial<RunnerHandDevelopmentEvaluation>,
): RunnerHandDevelopmentEvaluation {
  return {
    schemaVersion: "runner-hand-development-evaluation-v1",
    cardInstanceId,
    availability: "legal_now",
    developmentRole: "access_payoff",
    strategicFit: "strong",
    currentNeed: "useful_now",
    priority: 650,
    deferReason: "none",
    evidence: [],
    ...overrides,
  };
}

function runnerTacticalGoal(
  goalId: RunnerTacticalGoal["goalId"],
  overrides: Partial<RunnerTacticalGoal> = {},
): RunnerTacticalGoal {
  return {
    schemaVersion: "runner-tactical-goal-v1",
    goalId,
    family: "remote_contest",
    priority: 900,
    urgency: "high",
    source: "run_target_evaluation",
    evidence: [],
    ...overrides,
  };
}

function runnerEconomyPosture(params: {
  currentCredits: number;
  usefulHandCardsBlockedByCredits: number;
}): RunnerEconomyPosture {
  const creditReservePolicy = {
    schemaVersion: 1 as const,
    phase: "opening" as const,
    currentCredits: params.currentCredits,
    minimumCreditFloor: 2,
    breakerUseReserve: 2,
    contestReserve: 0,
    developmentReserve: 4,
    emergencyReserve: 0,
    desiredCreditReserve: 4,
    remoteScoreThreat: "none" as const,
    canContestIfFunded: false,
    belowReserveNow: params.currentCredits < 4,
    spendingWouldDropBelowReserve: false,
    reserveDrivers: ["phase:opening"],
    reserveOverrides: [],
    evidence: [],
  };
  return {
    schemaVersion: "runner-economy-posture-v1",
    minimumCreditFloor: 2,
    desiredCreditReserve: 4,
    creditReservePolicy,
    creditBasePlan: {
      schemaVersion: "runner-credit-base-plan-v1",
      currentCredits: params.currentCredits,
      minimumCreditFloor: 2,
      desiredCreditReserve: 4,
      runCostReserve: 2,
      creditReservePolicy,
      fundingNeed: true,
      usefulHandCardsBlockedByCredits: params.usefulHandCardsBlockedByCredits,
      usefulHandCardsAffordableNow: 0,
      recommendation: "fund_useful_hand_card",
      economyPriority: "high",
      evidence: [],
    },
    riskAdjustedRunReserve: false,
    buildEconomyBeforePressure: true,
    bankToolsRelevant: false,
    fundingNeed: true,
    recommendation: "build_economy",
    evidence: [],
  };
}
