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
import type { AiDeckDoctrineDeckSnapshot } from "./deck-doctrine";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "./runner-run-target-evaluation";
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
});

function benchmarkSnapshotById(snapshotId: string): AiDeckDoctrineDeckSnapshot {
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
      gripOrHq: [],
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
