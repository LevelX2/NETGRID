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
import {
  buildDeckCapabilityProfile,
  type DeckCapabilityProfile,
} from "./deck-capabilities";
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
import { resetResidentPlanPortfolioMemory } from "./plans/resident-plan-portfolio-memory";
import { withEffectiveRunQuote } from "./effective-run-quote.test-support";

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
    resetResidentPlanPortfolioMemory();
    delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
  });

  afterEach(() => {
    resetResidentPlanPortfolioMemory();
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
    expect(JSON.stringify(goals)).not.toMatch(
      /onr_v1_|Blink|deckHash|privatePayload/i,
    );
  });

  it("runs unknown reachable R&D and exposes redacted strategy debug", () => {
    const input = goldenInput({
      credits: 6,
      servers: [
        server("rd"),
        server("remote_2", {
          ice: [wallOfStatic("remote-ice-rd-choice")],
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
      grip: [
        visibleCard("safe-grip-1", { type: "event" }),
        visibleCard("safe-grip-2", { type: "event" }),
        visibleCard("safe-grip-3", { type: "event" }),
      ],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
      runnerTurnPlannerMode: "legacy_compare",
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("run-rd");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planKind).toBe("runner.pressure_central");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:pressure_rd_access",
        "plan_priority_class:P4",
        "plan_assessment_evidence:target:rd",
      ]),
    );
    expect(
      decision.decisionDebug?.actionAlternatives?.find(
        (alternative) => alternative.actionId === "run-rd",
      )?.whyChosen,
    ).toEqual(expect.arrayContaining(["selected_for_step:pressure_rd_access"]));
    expect(debugText).not.toMatch(
      /local_realistic_runner_blink_pressure_rig_snapshot_v1|onr_v1_|Blink|cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("exposes redacted Runner hand-development and creditbase debugfacts", () => {
    const input = goldenInput({
      credits: 10,
      servers: [server("hq")],
      grip: [
        visibleCard("access-card", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
          rulesText:
            "Whenever you access cards from HQ, access 1 additional card.",
        }),
      ],
      legalActions: [
        legalAction(
          "install-access-card",
          "install_card",
          "Install Access Payoff",
          {
            source: "access-card",
            payload: { cardId: "access-card" },
          },
        ),
      ],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
      runnerTurnPlannerMode: "legacy_compare",
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("install-access-card");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planKind).toBe(
      "runner.develop_board_and_hand",
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:develop_onr_v1_129_hq-interface",
        "plan_priority_class:P5",
      ]),
    );
    expect(debugText).not.toMatch(
      /deckSnapshotId|decklist|cardInstances|privatePayload|fullGameState|FullState|C:\\|\/Users\//i,
    );
  });

  it("uses last productive liquidity after rejecting stale known-low R&D and keeps the reason visible in debug", () => {
    const input = goldenInput({
      credits: 6,
      stateVersion: 3,
      servers: [server("rd")],
      legalActions: [
        runAction("run-rd", "rd"),
        legalAction("gain-credit", "gain_credit", "Gain 1"),
        legalAction("end-turn", "end_turn", "End turn", {
          source: "game_rule",
        }),
      ],
      eventTail: [
        {
          eventId: "golden-rd-low-value-run",
          type: "start_run",
          stateVersionBefore: 0,
          stateVersionAfter: 1,
          turnSerial: 0,
          stateHashAfter: "fnv1a:golden-rd-low-value-run",
          visibilityClass: "public",
          publicPayload: {
            actor: "runner",
            actionType: "start_run",
            serverId: "rd",
          },
        },
        {
          ...rdAccessEvent(
            "golden-rd-low-value-access",
            1,
            "onr_v1_281_accounts-receivable",
          ),
          turnSerial: 0,
        },
      ],
    });

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
      runnerTurnPlannerMode: "legacy_compare",
    });
    const runAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (alternative) => alternative.actionId === "run-rd",
    );

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planKind).toBe("runner.economy");
    expect(runAlternative?.whyNot).toEqual(
      expect.arrayContaining([
        "candidate_plan_evidence:runner_central_pressure_known_no_current_payoff:rd",
        "run_route_excluded:recommendation:do_not_run_now",
        "access_payoff:known_low_value",
      ]),
    );
  });

  it("turns a remote score threat behind missing coverage into breaker-first contest setup", () => {
    const input = goldenInput({
      credits: 6,
      servers: [
        server("remote_2", {
          ice: [wallOfStatic("remote-ice-coverage")],
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
      runnerTurnPlannerMode: "legacy_compare",
    });

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planKind).toBe("runner.economy");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:gain_general_liquid_credits",
        "plan_priority_class:P6",
      ]),
    );
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
  if (!snapshot)
    throw new Error("Missing Blink Pressure Rig benchmark snapshot");
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
    turnSerial: 0,
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

function wallOfStatic(instanceId: string): VisibleCard {
  const ice = visibleCard(instanceId, {
    definitionId: "onr_v1_279_wall-of-static",
    title: "Wall of Static",
    type: "ice",
    subtypes: ["wall"],
    known: true,
    rezzed: true,
    strength: 2,
  });
  return withEffectiveRunQuote(ice, {
    effectiveStrength: 2,
    subroutines: [
      {
        id: `${instanceId}-end-the-run`,
        type: "end_the_run",
        sourceDefinitionId: "onr_v1_279_wall-of-static",
        sourceTitle: "Wall of Static",
      },
    ],
  });
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
  return (
    debug?.detailSections
      ?.find((section) => section.id === "tactical_plan")
      ?.items.join("\n") ?? ""
  );
}
