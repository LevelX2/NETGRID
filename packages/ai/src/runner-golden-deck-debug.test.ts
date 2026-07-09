import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import benchmarkSnapshotsData from "../../../data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json";
import { buildDeckCapabilityProfile, type DeckCapabilityProfile } from "./deck-capabilities";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";
import { chooseRunnerAction } from "./index";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "./runner-run-target-evaluation";
import {
  buildRunnerStrategicIntentProfile,
  type RunnerStrategicIntentProfile,
} from "./runner-strategic-intent";
import { buildRunnerTacticalGoals } from "./runner-tactical-goals";
import { resetTacticalPlanMemory } from "./tactical-plans";

const benchmarkSnapshots = benchmarkSnapshotsData.snapshots as Array<{
  deckSnapshotId: string;
  side: "runner" | "corp";
  cards: Array<{ cardId: string; quantity: number }>;
}>;

type AiDecisionInputWithRunnerProjection = AiDecisionInput & {
  ownDeckCapabilities: DeckCapabilityProfile;
  ownRunnerStrategicIntent: RunnerStrategicIntentProfile;
};

describe("Runner Golden Deck strategy and debug", () => {
  const originalRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

  beforeEach(() => {
    resetTacticalPlanMemory();
    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
  });

  afterEach(() => {
    resetTacticalPlanMemory();
    if (originalRuntimeMode === undefined) {
      delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    } else {
      process.env.NETGRID_SEMANTIC_AI_RUNTIME = originalRuntimeMode;
    }
  });

  it("projects Blink Pressure Rig into generic match-start Runner intent", () => {
    const snapshot = goldenBlinkSnapshot();
    const input = goldenInput({
      credits: 5,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
      snapshot,
    });
    const goals = buildRunnerTacticalGoals({
      input,
      strategicIntent: input.ownRunnerStrategicIntent,
      runTargetEvaluations: evaluateRunnerRunTargets({
        input,
        strategicIntent: input.ownRunnerStrategicIntent,
        deckCapabilities: input.ownDeckCapabilities,
      }),
      economyPosture: buildRunnerEconomyPosture({
        input,
        strategicIntent: input.ownRunnerStrategicIntent,
        deckCapabilities: input.ownDeckCapabilities,
      }),
      deckCapabilities: input.ownDeckCapabilities,
    });

    expect(input.ownRunnerStrategicIntent.primaryWinIntent).toBe(
      "runner.steal_agendas_default",
    );
    expect(input.ownRunnerStrategicIntent.executionStyle).toBe(
      "runner.run_event_tempo",
    );
    expect(input.ownRunnerStrategicIntent.setupEngine).toEqual(
      expect.arrayContaining([
        "runner.search_breaker_setup",
        "runner.rig_first",
        "runner.economy_setup_before_pressure",
      ]),
    );
    expect(goals.map((goal) => goal.goalId)).toEqual(
      expect.arrayContaining([
        "runner.find_or_install_primary_breaker",
        "runner.draw_or_search_for_setup",
        "runner.build_economy_base",
      ]),
    );
  });

  it("keeps primary-breaker setup generic when the deck can search or draw", () => {
    const input = goldenInput({
      credits: 5,
      servers: [server("hq")],
      legalActions: [
        runAction("run-hq", "hq"),
        legalAction("draw", "draw_card", "Draw"),
      ],
    });
    const goals = buildRunnerTacticalGoals({
      input,
      strategicIntent: input.ownRunnerStrategicIntent,
      economyPosture: buildRunnerEconomyPosture({
        input,
        strategicIntent: input.ownRunnerStrategicIntent,
        deckCapabilities: input.ownDeckCapabilities,
      }),
      deckCapabilities: input.ownDeckCapabilities,
    });

    expect(goals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          goalId: "runner.find_or_install_primary_breaker",
          source: "strategic_intent",
        }),
        expect.objectContaining({
          goalId: "runner.draw_or_search_for_setup",
          source: "strategic_intent",
        }),
      ]),
    );
    expect(JSON.stringify(goals)).not.toMatch(/onr_v1_|Blink|deckHash|privatePayload/i);
  });

  it("runs unknown reachable R&D and exposes redacted strategy debug", () => {
    const input = goldenInput({
      credits: 6,
      servers: [
        server("rd"),
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
      legalActions: [
        runAction("run-rd", "rd"),
        runAction("run-remote-2", "remote_2"),
      ],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const debugText = JSON.stringify(decision.decisionDebug);
    const tacticalDebug = tacticalPlanDebugText(decision.decisionDebug);

    expect(decision.actionId).toBe("run-rd");
    expect(tacticalDebug).toContain(
      "runner_strategic_intent_used:runner_strategic_intent:runner.steal_agendas_default",
    );
    expect(tacticalDebug).toContain(
      "runner_run_target_used:runner_run_target:rd",
    );
    expect(tacticalDebug).toContain(
      "runner_economy_posture_used:runner_economy_recommendation",
    );
    expect(tacticalDebug).toContain(
      "runner_tactical_goal_used:runner_tactical_goal:runner.pressure_good_central_target",
    );
    expect(tacticalDebug).toContain("selected_plan:");
    expect(tacticalDebug).toContain("mapped_legal_actions:run-rd");
    expect(tacticalDebug).toContain("why_this_action:");
    expect(tacticalDebug).toContain("plan_rank|rank=1");
    expect(debugText).not.toMatch(
      /local_realistic_runner_blink_pressure_rig_snapshot_v1|onr_v1_|Blink|cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("exposes redacted Runner hand-development and creditbase debugfacts", () => {
    const input = goldenInput({
      credits: 5,
      servers: [server("hq")],
      grip: [
        visibleCard("access-card", {
          definitionId: "runner_access_payoff_card",
          title: "Access Payoff",
          type: "hardware",
          rulesText: "access payoff support",
        }),
      ],
      legalActions: [
        runAction("run-hq", "hq"),
        legalAction("install-access-card", "install_card", "Install Access Payoff", {
          source: "access-card",
          payload: { cardId: "access-card" },
        }),
      ],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const debugText = JSON.stringify(decision.decisionDebug);
    const tacticalDebug = tacticalPlanDebugText(decision.decisionDebug);

    expect(decision.actionId).toBe("install-access-card");
    expect(tacticalDebug).toContain("runner_hand_development_used:");
    expect(tacticalDebug).toContain("runner_hand_development:access_payoff");
    expect(tacticalDebug).toContain(
      "runner_credit_base_recommendation:allow_setup_spend",
    );
    expect(tacticalDebug).toContain("runner_credit_reserve_current_credits:5");
    expect(tacticalDebug).toContain("runner_credit_reserve_desired:6");
    expect(tacticalDebug).toContain(
      "why_spend_allowed_despite_reserve:setup_card_payoff",
    );
    expect(tacticalDebug).toContain(
      "selected_development_goal:hand_development_role:access_payoff",
    );
    expect(debugText).not.toMatch(
      /deckSnapshotId|decklist|cardInstances|privatePayload|fullGameState|FullState|C:\\|\/Users\//i,
    );
  });

  it("avoids stale known-low R&D and keeps the reason visible in debug", () => {
    const input = goldenInput({
      credits: 6,
      stateVersion: 3,
      servers: [server("rd")],
      legalActions: [
        runAction("run-rd", "rd"),
        legalAction("gain-credit", "gain_credit", "Gain 1"),
      ],
      eventTail: [
        rdAccessEvent(
          "golden-rd-low-value-access",
          1,
          "onr_v1_281_accounts-receivable",
        ),
      ],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("gain-credit");
    expect(debugText).toContain("runner_run_target:rd");
    expect(debugText).toContain("payoff:known_low_value");
    expect(debugText).toContain("recommendation:do_not_run_now");
    expect(debugText).toContain(
      "runner_tactical_goal:runner.avoid_low_value_risk_runs",
    );
  });

  it("turns a remote score threat behind missing coverage into breaker-first contest setup", () => {
    const input = goldenInput({
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

    const evaluations = evaluateRunnerRunTargets({
      input,
      strategicIntent: input.ownRunnerStrategicIntent,
      deckCapabilities: input.ownDeckCapabilities,
    });
    const goals = buildRunnerTacticalGoals({
      input,
      strategicIntent: input.ownRunnerStrategicIntent,
      runTargetEvaluations: evaluations,
      economyPosture: buildRunnerEconomyPosture({
        input,
        strategicIntent: input.ownRunnerStrategicIntent,
        deckCapabilities: input.ownDeckCapabilities,
      }),
      deckCapabilities: input.ownDeckCapabilities,
    });

    expect(evaluations[0]).toMatchObject({
      targetServerId: "remote_2",
      scoreThreat: true,
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
    expect(goals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          goalId: "runner.contest_remote_if_score_threat",
          targetServerId: "remote_2",
        }),
      ]),
    );
  });

  it("marks a known no-payoff remote as do-not-run", () => {
    const input = goldenInput({
      credits: 6,
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-root-1", {
              definitionId: "onr_v1_281_accounts-receivable",
              type: "operation",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      strategicIntent: input.ownRunnerStrategicIntent,
      deckCapabilities: input.ownDeckCapabilities,
    });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      knownAccessState: "known_no_current_payoff",
      recommendation: "known_no_current_payoff",
    });
  });

  it("chooses economy at low credits when no high payoff exists", () => {
    const input = goldenInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [
        runAction("run-hq", "hq"),
        legalAction("gain-credit", "gain_credit", "Gain 1"),
      ],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("gain-credit");
    expect(debugText).toContain("runner_economy_recommendation:build_economy");
    expect(debugText).toContain("runner_economy_funding_need:true");
  });

  it("recognizes Broker cashout as immediate economy posture", () => {
    const input = goldenInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [
        legalAction("broker-cashout", "trigger_ability", "Von Broker nehmen", {
          source: "broker-installed",
          payload: {
            source: "broker-installed",
            cardImplementationTakesHostedCredits: true,
          },
        }),
      ],
    });
    const posture = buildRunnerEconomyPosture({
      input,
      strategicIntent: input.ownRunnerStrategicIntent,
      deckCapabilities: input.ownDeckCapabilities,
    });
    const goals = buildRunnerTacticalGoals({
      input,
      strategicIntent: input.ownRunnerStrategicIntent,
      economyPosture: posture,
      deckCapabilities: input.ownDeckCapabilities,
    });

    expect(posture).toMatchObject({
      fundingNeed: true,
      recommendation: "cash_out_bank",
    });
    expect(goals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          goalId: "runner.build_economy_base",
          source: "economy_posture",
        }),
      ]),
    );
  });
});

function goldenInput(params: {
  credits: number;
  servers: PlayerView["servers"];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
  grip?: VisibleCard[];
  stateVersion?: number;
  eventTail?: PublicGameEvent[];
  snapshot?: AiDeckStrategyDeckSnapshot;
}): AiDecisionInputWithRunnerProjection {
  const snapshot = params.snapshot ?? goldenBlinkSnapshot();
  const view = playerView({
    credits: params.credits,
    servers: params.servers,
    legalActions: params.legalActions,
    ...(params.rig ? { rig: params.rig } : {}),
    ...(params.grip ? { grip: params.grip } : {}),
    ...(params.stateVersion ? { stateVersion: params.stateVersion } : {}),
    ...(params.eventTail ? { eventTail: params.eventTail } : {}),
  });
  const input: AiDecisionInput = {
    side: "runner",
    playerView: view,
    eventTail: params.eventTail ?? [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-golden-deck-debug-test",
    decisionId: `runner-golden-deck-debug-test:${view.stateVersion}:runner`,
    actionNumber: view.stateVersion,
    profileId: "runner-golden-deck-debug-test",
  };
  const ownDeckCapabilities = buildDeckCapabilityProfile({
    side: "runner",
    playerView: view,
    legalActions: params.legalActions,
    deckSnapshot: snapshot,
  });
  const ownRunnerStrategicIntent = buildRunnerStrategicIntentProfile({
    strategyProfile: buildDeckStrategyProfile(snapshot),
    deckCapabilities: ownDeckCapabilities,
  });
  return {
    ...input,
    ownDeckCapabilities,
    ownRunnerStrategicIntent,
  };
}

function goldenBlinkSnapshot(): AiDeckStrategyDeckSnapshot {
  const snapshot = benchmarkSnapshots.find(
    (candidate) =>
      candidate.deckSnapshotId ===
      "local_realistic_runner_blink_pressure_rig_snapshot_v1",
  );
  if (!snapshot) throw new Error("Missing Blink Pressure Rig benchmark snapshot");
  return {
    deckSnapshotId: snapshot.deckSnapshotId,
    side: snapshot.side,
    cards: snapshot.cards.map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function playerView(params: {
  credits: number;
  servers: PlayerView["servers"];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
  grip?: VisibleCard[];
  stateVersion?: number;
  eventTail?: PublicGameEvent[];
}): PlayerView {
  return {
    stateVersion: params.stateVersion ?? 1,
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
    publicEvents: params.eventTail ?? [],
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
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
  return legalAction(actionId, "start_run", `Run ${serverId}`, {
    payload: { serverId },
  });
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  label: string,
  options: {
    source?: string;
    payload?: LegalAction["payload"];
  } = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label,
    source: options.source ?? "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    ...(options.payload ? { payload: options.payload } : {}),
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

function rdAccessEvent(
  eventId: string,
  stateVersionBefore: number,
  cardDefinitionId: string,
): PublicGameEvent {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId,
    },
  };
}

function tacticalPlanDebugText(
  debug: ReturnType<typeof chooseRunnerAction>["decisionDebug"],
): string {
  return debug?.detailSections
    ?.find((section) => section.id === "tactical_plan")
    ?.items.join("\n") ?? "";
}
