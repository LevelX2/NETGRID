import { describe, expect, it } from "vitest";

import benchmarkSnapshotsData from "../../../data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import { buildActionSemanticCandidates } from "./action-semantic-candidate";
import { buildDeckCapabilityProfile } from "./deck-capabilities";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "./runner-run-target-evaluation";
import {
  RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
  type RunnerHandDevelopmentEvaluation,
} from "./runner-hand-development";
import { buildRunnerStrategicIntentProfile } from "./runner-strategic-intent";
import { buildRunnerTacticalGoals } from "./runner-tactical-goals";
import { evaluateTacticalPlans } from "./tactical-plans";

const benchmarkSnapshots = benchmarkSnapshotsData.snapshots as Array<{
  deckSnapshotId: string;
  side: "runner" | "corp";
  cards: Array<{ cardId: string; quantity: number }>;
}>;

describe("Runner TacticalGoalIntegration", () => {
  it("derives generic setup, economy and risk-control goals for Blink Pressure Rig", () => {
    const snapshot = benchmarkSnapshotById(
      "local_realistic_runner_blink_pressure_rig_snapshot_v1",
    );
    const input = aiInput({
      credits: 5,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
    });
    const deckCapabilities = buildDeckCapabilityProfile({
      side: "runner",
      playerView: input.playerView,
      legalActions: input.legalActions,
      deckSnapshot: snapshot,
    });
    const strategicIntent = buildRunnerStrategicIntentProfile({
      strategyProfile: buildDeckStrategyProfile(snapshot),
      deckCapabilities,
    });
    const economyPosture = buildRunnerEconomyPosture({
      input,
      strategicIntent,
      deckCapabilities,
    });
    const runTargetEvaluations = evaluateRunnerRunTargets({
      input,
      strategicIntent,
      deckCapabilities,
    });

    const goals = buildRunnerTacticalGoals({
      input,
      strategicIntent,
      runTargetEvaluations,
      economyPosture,
      deckCapabilities,
    });

    expect(goals.map((goal) => goal.goalId)).toEqual(
      expect.arrayContaining([
        "runner.find_or_install_primary_breaker",
        "runner.build_economy_base",
        "runner.draw_or_search_for_setup",
        "runner.avoid_low_value_risk_runs",
      ]),
    );
    expect(JSON.stringify(goals)).not.toMatch(/onr_v1_|Blink|deckHash|privatePayload/i);
  });

  it("derives a remote-contest setup goal for score threat behind missing coverage", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_2", {
          ice: [
            visibleCard("remote-ice-1", {
              definitionId: "onr_v1_279_wall-of-static",
              title: "Wall of Static",
              type: "ice",
              subtypes: ["wall"],
              known: true,
              rezzed: true,
            }),
          ],
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-2", "remote_2")],
    });
    const runTargetEvaluations = evaluateRunnerRunTargets({ input });

    const goals = buildRunnerTacticalGoals({
      input,
      runTargetEvaluations,
      economyPosture: buildRunnerEconomyPosture({ input }),
    });

    expect(goals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          goalId: "runner.contest_remote_if_score_threat",
          targetServerId: "remote_2",
          urgency: "high",
        }),
      ]),
    );
  });

  it("maps remote contest reserve pressure to gain credits before pressure", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_2", {
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [
        runAction("run-remote-2", "remote_2"),
        gainCreditAction("gain-credit"),
      ],
    });
    const runTargetEvaluations = evaluateRunnerRunTargets({ input });
    const economyPosture = buildRunnerEconomyPosture({ input });
    const runnerTacticalGoals = buildRunnerTacticalGoals({
      input,
      runTargetEvaluations,
      economyPosture,
    });

    const result = evaluateTacticalPlans({
      input,
      runnerRunTargetEvaluations: runTargetEvaluations,
      runnerEconomyPosture: economyPosture,
      runnerTacticalGoals,
      candidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
    });

    expect(economyPosture.creditReservePolicy).toMatchObject({
      remoteScoreThreat: "urgent",
      contestReserve: 8,
      belowReserveNow: true,
    });
    expect(JSON.stringify(runnerTacticalGoals)).toContain(
      "credit_reserve_remote_score_threat:urgent",
    );
    expect(result.selectedStep?.kind).toBe("gain_credits");
    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "gain-credit",
    ]);
    expect(JSON.stringify(result.runnerEconomyPostureUsed)).toContain(
      "runner_credit_reserve_contest:8",
    );
    expect(result.runnerEconomyPostureUsed).toEqual(
      expect.arrayContaining([
        "runner_credit_reserve_current_credits:6",
        "runner_credit_reserve_desired:8",
        "runner_credit_reserve_spending_would_drop:false",
        "runner_credit_reserve_penalty:60",
        "why_economy_over_run_or_install:remote_contest_reserve",
        "why_spend_allowed_despite_reserve:not_allowed",
      ]),
    );
    expect(result.runnerEconomyPostureUsed?.join("\n")).toContain(
      "runner_credit_reserve_reasons:phase:late_contest|remote_score_threat:urgent",
    );
    expect(JSON.stringify(result.runnerEconomyPostureUsed)).not.toMatch(
      /cardInstances|privatePayload|fullGameState|decklist|C:\\|\/Users\//i,
    );
  });

  it("blocks central probes while remote contest funding is needed", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("hq"),
        server("rd"),
        server("remote_2", {
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [
        runAction("run-hq", "hq"),
        runAction("run-rd", "rd"),
        runAction("run-remote-2", "remote_2"),
        gainCreditAction("gain-credit"),
      ],
    });
    const runTargetEvaluations = evaluateRunnerRunTargets({ input });
    const economyPosture = buildRunnerEconomyPosture({ input });
    const runnerTacticalGoals = buildRunnerTacticalGoals({
      input,
      runTargetEvaluations,
      economyPosture,
    });

    const result = evaluateTacticalPlans({
      input,
      runnerRunTargetEvaluations: runTargetEvaluations,
      runnerEconomyPosture: economyPosture,
      runnerTacticalGoals,
      candidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
    });

    expect(economyPosture.creditReservePolicy).toMatchObject({
      remoteScoreThreat: "urgent",
      belowReserveNow: true,
      canContestIfFunded: true,
    });
    expect(result.selectedStep?.kind).toBe("gain_credits");
    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "gain-credit",
    ]);
    expect(JSON.stringify(result.planAlternatives)).toContain(
      "remote_contest_funding_need",
    );
    expect(JSON.stringify(result.planAlternatives)).not.toContain(
      "pressure_probe_allowed:true",
    );
  });

  it("allows a free unknown R&D probe while economy reserve is active", () => {
    const input = aiInput({
      credits: 3,
      servers: [server("rd")],
      legalActions: [
        runAction("run-rd", "rd"),
        gainCreditAction("gain-credit"),
      ],
    });
    const runTargetEvaluations = evaluateRunnerRunTargets({ input });
    const economyPosture = buildRunnerEconomyPosture({ input });
    const runnerTacticalGoals = buildRunnerTacticalGoals({
      input,
      runTargetEvaluations,
      economyPosture,
    });

    const result = evaluateTacticalPlans({
      input,
      runnerRunTargetEvaluations: runTargetEvaluations,
      runnerEconomyPosture: economyPosture,
      runnerTacticalGoals,
      candidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
    });

    expect(economyPosture.creditBasePlan.economyPriority).toBe("medium");
    expect(result.selectedPlan?.type).toBe("runner.opportunistic_central_run");
    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "run-rd",
    ]);
    expect(JSON.stringify(result.planAlternatives)).toContain(
      "pressure_probe_allowed:true",
    );
    expect(JSON.stringify(result.planAlternatives)).toContain(
      "variation_reason:deterministic_priority_only",
    );
    expect(result.runnerEconomyPostureUsed).toEqual(
      expect.arrayContaining([
        "runner_credit_reserve_current_credits:3",
        "runner_credit_reserve_desired:4",
        "runner_credit_reserve_penalty:30",
        "why_spend_allowed_despite_reserve:not_allowed",
      ]),
    );
    expect(JSON.stringify(result.planAlternatives)).toContain(
      "why_spend_allowed_despite_reserve:pressure_budget_probe",
    );
  });

  it("uses deterministic near-tie variation between safe central probes", () => {
    const input = aiInput({
      credits: 3,
      servers: [server("hq"), server("rd")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
      ],
      legalActions: [
        runAction("run-hq", "hq"),
        runAction("run-rd", "rd"),
        gainCreditAction("gain-credit"),
      ],
    });
    input.playerView.stateVersion = 2;
    const runTargetEvaluations = evaluateRunnerRunTargets({ input });
    const economyPosture = buildRunnerEconomyPosture({ input });
    const runnerTacticalGoals = buildRunnerTacticalGoals({
      input,
      runTargetEvaluations,
      economyPosture,
    });

    const result = evaluateTacticalPlans({
      input,
      runnerRunTargetEvaluations: runTargetEvaluations,
      runnerEconomyPosture: economyPosture,
      runnerTacticalGoals,
      candidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
    });
    const repeatedResult = evaluateTacticalPlans({
      input,
      runnerRunTargetEvaluations: runTargetEvaluations,
      runnerEconomyPosture: economyPosture,
      runnerTacticalGoals,
      candidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
    });

    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "run-hq",
    ]);
    expect(repeatedResult.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "run-hq",
    ]);
    expect(JSON.stringify(result.planAlternatives)).toContain(
      "bounded_variation_applied:true",
    );
    expect(JSON.stringify(result.planAlternatives)).toContain(
      "preferred_probe_target:hq",
    );
    expect(JSON.stringify(result.planAlternatives)).toContain(
      "pressure_probe_variation_bonus:25",
    );
  });

  it("does not let variation lift a non-near-tie central probe", () => {
    const input = aiInput({
      credits: 3,
      servers: [server("hq"), server("rd")],
      legalActions: [
        runAction("run-hq", "hq"),
        runAction("run-rd", "rd"),
        gainCreditAction("gain-credit"),
      ],
    });
    input.playerView.stateVersion = 2;
    const runTargetEvaluations = evaluateRunnerRunTargets({ input });
    const economyPosture = buildRunnerEconomyPosture({ input });
    const runnerTacticalGoals = buildRunnerTacticalGoals({
      input,
      runTargetEvaluations,
      economyPosture,
    });

    const result = evaluateTacticalPlans({
      input,
      runnerRunTargetEvaluations: runTargetEvaluations,
      runnerEconomyPosture: economyPosture,
      runnerTacticalGoals,
      candidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
    });

    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "run-rd",
    ]);
    expect(JSON.stringify(result.planAlternatives)).toContain(
      "near_tie_probe_targets:rd",
    );
    expect(JSON.stringify(result.planAlternatives)).toContain(
      "bounded_variation_applied:false",
    );
  });

  it("feeds run target goals into TacticalPlans without creating LegalActions", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
    });
    const runTargetEvaluations = evaluateRunnerRunTargets({ input });
    const economyPosture = buildRunnerEconomyPosture({ input });
    const runnerTacticalGoals = buildRunnerTacticalGoals({
      input,
      runTargetEvaluations,
      economyPosture,
    });

    const result = evaluateTacticalPlans({
      input,
      runnerRunTargetEvaluations: runTargetEvaluations,
      runnerEconomyPosture: economyPosture,
      runnerTacticalGoals,
      candidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
    });

    expect(result.selectedPlan?.target?.id).toBe("rd");
    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "run-rd",
    ]);
    expect(input.legalActions.map((action) => action.actionId)).toContain(
      result.selectedMapping?.legalActions[0]?.actionId,
    );
    expect(result.runnerTacticalGoalsUsed?.join("\n")).toContain(
      "runner_tactical_goal:runner.pressure_good_central_target",
    );
  });

  it("maps low-credit creditbase planning to an existing gain-credit LegalAction", () => {
    const input = aiInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [
        runAction("run-hq", "hq"),
        gainCreditAction("gain-credit"),
      ],
    });
    const handDevelopmentEvaluations = [
      handDevelopmentEvaluation({
        developmentRole: "access_payoff",
        availability: "missing_credits",
        currentNeed: "useful_now",
        priority: 650,
        fundingNeed: {
          installOrPlayCost: 4,
          missingCredits: 4,
          reason: "cannot_pay",
        },
      }),
    ];
    const runTargetEvaluations = evaluateRunnerRunTargets({
      input,
      handDevelopmentEvaluations,
    });
    const economyPosture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations,
    });
    const runnerTacticalGoals = buildRunnerTacticalGoals({
      input,
      runTargetEvaluations,
      economyPosture,
    });

    const result = evaluateTacticalPlans({
      input,
      runnerRunTargetEvaluations: runTargetEvaluations,
      runnerEconomyPosture: economyPosture,
      runnerTacticalGoals,
      candidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
    });

    expect(economyPosture.creditBasePlan).toMatchObject({
      recommendation: "fund_useful_hand_card",
      usefulHandCardsBlockedByCredits: 1,
    });
    expect(result.selectedStep?.kind).toBe("gain_credits");
    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "gain-credit",
    ]);
    expect(input.legalActions.map((action) => action.actionId)).toContain(
      result.selectedMapping?.legalActions[0]?.actionId,
    );
    expect(JSON.stringify(runnerTacticalGoals)).toContain(
      "credit_base_recommendation:fund_useful_hand_card",
    );
  });

  it("maps a high access-payoff hand development goal to its legal install action over a weak run", () => {
    const input = aiInput({
      credits: 5,
      servers: [server("hq")],
      grip: [
        visibleCard("access-card", {
          definitionId: "access_payoff_card",
          type: "hardware",
        }),
      ],
      legalActions: [
        runAction("run-hq", "hq"),
        installAction("install-access-card", "access-card"),
      ],
    });
    const handDevelopmentEvaluations = [
      handDevelopmentEvaluation({
        cardInstanceId: "access-card",
        legalActionId: "install-access-card",
        developmentRole: "access_payoff",
        availability: "legal_now",
        currentNeed: "useful_now",
        priority: 650,
        deferReason: "none",
      }),
    ];

    const result = tacticalResultFor(input, handDevelopmentEvaluations);

    expect(result.selectedPlan?.type).toBe("runner.develop_hand_card");
    expect(result.selectedStep?.kind).toBe("install_development_card");
    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "install-access-card",
    ]);
    expect(input.legalActions.map((action) => action.actionId)).toContain(
      result.selectedMapping?.legalActions[0]?.actionId,
    );
  });

  it("maps acute memory-support hand development to legal memory hardware", () => {
    const input = aiInput({
      credits: 5,
      servers: [server("hq")],
      grip: [
        visibleCard("memory-hardware", {
          definitionId: "memory_hardware",
          type: "hardware",
          memoryLimitBonus: 2,
        }),
      ],
      legalActions: [
        runAction("run-hq", "hq"),
        installAction("install-memory", "memory-hardware"),
      ],
    });

    const result = tacticalResultFor(input, [
      handDevelopmentEvaluation({
        cardInstanceId: "memory-hardware",
        legalActionId: "install-memory",
        developmentRole: "memory_support",
        availability: "legal_now",
        currentNeed: "acute",
        priority: 760,
        deferReason: "none",
      }),
    ]);

    expect(result.selectedPlan?.type).toBe("runner.develop_hand_card");
    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "install-memory",
    ]);
  });

  it("does not map defense support without a visible current need", () => {
    const input = aiInput({
      credits: 5,
      servers: [server("hq")],
      grip: [
        visibleCard("defense-card", {
          definitionId: "defense_card",
          type: "resource",
        }),
      ],
      legalActions: [
        runAction("run-hq", "hq"),
        installAction("install-defense", "defense-card"),
      ],
    });

    const result = tacticalResultFor(input, [
      handDevelopmentEvaluation({
        cardInstanceId: "defense-card",
        legalActionId: "install-defense",
        developmentRole: "defense_support",
        availability: "legal_now",
        currentNeed: "none",
        strategicFit: "weak",
        priority: 700,
        deferReason: "no_current_need",
      }),
    ]);

    expect(result.planAlternatives.map((plan) => plan.type)).not.toContain(
      "runner.develop_hand_card",
    );
    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).not.toContain(
      "install-defense",
    );
  });

  it("lets useful setup beat underfunded unknown remote score-threat pressure", () => {
    const input = aiInput({
      credits: 5,
      servers: [
        server("remote_2", {
          root: [visibleCard("remote-root", { known: false, advancementCounters: 2 })],
        }),
      ],
      grip: [
        visibleCard("access-card", {
          definitionId: "access_payoff_card",
          type: "hardware",
        }),
      ],
      legalActions: [
        runAction("run-remote-2", "remote_2"),
        installAction("install-access-card", "access-card"),
      ],
    });

    const result = tacticalResultFor(input, [
      handDevelopmentEvaluation({
        cardInstanceId: "access-card",
        legalActionId: "install-access-card",
        developmentRole: "access_payoff",
        availability: "legal_now",
        currentNeed: "useful_now",
        priority: 800,
        deferReason: "none",
      }),
    ]);

    expect(result.selectedPlan?.type).toBe("runner.develop_hand_card");
    expect(result.selectedMapping?.legalActions.map((action) => action.actionId)).toEqual([
      "install-access-card",
    ]);
  });
});

function benchmarkSnapshotById(snapshotId: string): AiDeckStrategyDeckSnapshot {
  const snapshot = benchmarkSnapshots.find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) throw new Error(`Missing benchmark snapshot ${snapshotId}`);
  return {
    deckSnapshotId: snapshot.deckSnapshotId,
    side: snapshot.side,
    cards: snapshot.cards.map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function aiInput(params: {
  credits: number;
  servers: PlayerView["servers"];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
  grip?: VisibleCard[];
}): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: params.credits,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: params.grip ?? [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: params.rig ?? [],
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
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: params.servers,
    publicEvents: [],
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-tactical-goals-test",
    decisionId: "runner-tactical-goals-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  overrides: Partial<PlayerView["servers"][number]> = {},
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice: [],
    root: [],
    ...overrides,
  };
}

function runAction(actionId: string, serverId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: `Run ${serverId}`,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { serverId },
  };
}

function gainCreditAction(actionId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "gain_credit",
    label: "Gain 1 credit",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  };
}

function installAction(actionId: string, source: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "install_card",
    label: `Install ${source}`,
    source,
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { cardId: source },
  };
}

function visibleIdentity(side: Side): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}

function visibleCard(
  instanceId: string,
  overrides: Omit<Partial<VisibleCard>, "instanceId"> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    ...overrides,
  };
}

function handDevelopmentEvaluation(
  overrides: Partial<RunnerHandDevelopmentEvaluation>,
): RunnerHandDevelopmentEvaluation {
  return {
    schemaVersion: RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
    cardInstanceId: "runner-hand-card",
    availability: "missing_credits",
    developmentRole: "access_payoff",
    strategicFit: "strong",
    currentNeed: "useful_now",
    priority: 600,
    deferReason: "missing_credits",
    evidence: ["source:own_runner_hand"],
    ...overrides,
  };
}

function tacticalResultFor(
  input: AiDecisionInput,
  handDevelopmentEvaluations: RunnerHandDevelopmentEvaluation[],
) {
  const runTargetEvaluations = evaluateRunnerRunTargets({
    input,
    handDevelopmentEvaluations,
  });
  const economyPosture = buildRunnerEconomyPosture({
    input,
    handDevelopmentEvaluations,
  });
  const runnerTacticalGoals = buildRunnerTacticalGoals({
    input,
    runTargetEvaluations,
    economyPosture,
  });
  return evaluateTacticalPlans({
    input,
    runnerRunTargetEvaluations: runTargetEvaluations,
    runnerEconomyPosture: economyPosture,
    runnerHandDevelopmentEvaluations: handDevelopmentEvaluations,
    runnerTacticalGoals,
    candidates: buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
    }),
  });
}
