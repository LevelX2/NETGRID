import { afterEach, describe, expect, it } from "vitest";

import { chooseCorpAction, chooseRunnerAction } from "./index";
import { buildDeckCapabilityProfile } from "./deck-capabilities";
import type { AiDeckDoctrineDeckSnapshot } from "./deck-doctrine";
import {
  buildDeckStrategyProfile,
  type AiDeckStrategyProfile,
} from "./deck-doctrine-strategy";
import { buildCorpStrategicIntentProfile } from "./corp-strategic-intent";
import { buildRunnerStrategicIntentProfile } from "./runner-strategic-intent";
import { buildStrategicIntentState } from "./strategic-intent-state";
import {
  getTacticalPlanMemorySnapshot,
  resetTacticalPlanMemory,
} from "./tactical-plans";
import type { AiDecisionInputWithDeckCapabilities } from "./runtime/ai-decision-input";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";

describe("Deck strategy runtime vertical slices", () => {
  afterEach(() => {
    resetTacticalPlanMemory();
  });

  it("recognizes representative golden strategy fixtures", () => {
    const cases: Array<{
      snapshot: AiDeckDoctrineDeckSnapshot;
      expectedStrategy: string;
    }> = [
      {
        snapshot: runnerCentralPressureSnapshot(),
        expectedStrategy: "runner.rnd_pressure",
      },
      {
        snapshot: runnerRemoteContestSnapshot(),
        expectedStrategy: "runner.remote_contest",
      },
      {
        snapshot: corpTagPunishSnapshot(),
        expectedStrategy: "corp.tag_trace_punish",
      },
      {
        snapshot: corpRemoteScoringSnapshot(),
        expectedStrategy: "corp.remote_scoring",
      },
      {
        snapshot: corpIceTaxSnapshot(),
        expectedStrategy: "corp.ice_tax_glacier",
      },
    ];

    for (const { snapshot, expectedStrategy } of cases) {
      const profile = buildDeckStrategyProfile(snapshot);
      const score = profile.strategyScores[expectedStrategy];

      expect(score).toBeDefined();
      expect((score?.anchorScore ?? 0) + (score?.supportScore ?? 0)).toBeGreaterThan(0);
      expect(score?.runtimeStatus).not.toBe("diagnostic_only");
    }
  });

  it("runs Runner central pressure across two decisions and preserves plan progress", () => {
    const runRd = legalAction("run-rd", "runner", "start_run", "Run R&D", {
      payload: { serverId: "rd" },
    });
    const draw = legalAction("draw", "runner", "draw_card", "Draw");
    const input = strategicInput({
      side: "runner",
      snapshot: runnerCentralPressureSnapshot(),
      actions: [runRd, draw],
      credits: 6,
      servers: [server("hq"), server("rd"), server("archives")],
      targetVector: {
        kind: "central",
        targetId: "rd",
        evidence: ["dsr08:runner_central_pressure"],
      },
      strategyId: "runner.rnd_pressure",
    });

    const first = chooseRunnerAction(input);
    const firstMemory = getTacticalPlanMemorySnapshot(input);
    const second = chooseRunnerAction({
      ...input,
      decisionId: input.decisionId.replace(":1", ":2"),
      actionNumber: 2,
      playerView: {
        ...input.playerView,
        stateVersion: 2,
      },
    });

    expect(first.actionId).toBe("run-rd");
    expect(first.evidence).toContain("semantic_strategic_action_fit:true");
    expect(firstMemory?.planId).toBe("runner.opportunistic_central_run:rd");
    expect(second.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_memory_status:satisfied",
      ]),
    );
  });

  it("uses Corp tag-punish payoff only when the boardstate window exists", () => {
    const closedAccounts = visibleCard("closed-accounts", "corp", "operation", {
      definitionId: "onr_v1_285_closed-accounts",
      title: "Closed Accounts",
    });
    const punish = legalAction(
      "closed-accounts",
      "corp",
      "play_operation",
      "Closed Accounts spielen",
      { source: closedAccounts.instanceId, cost: 1 },
    );
    const gain = legalAction("gain-credit", "corp", "gain_credit", "Gain 1");
    const taggedInput = strategicInput({
      side: "corp",
      snapshot: corpTagPunishSnapshot(),
      actions: [punish, gain],
      credits: 5,
      gripOrHq: [closedAccounts],
      runnerTags: 1,
      runnerCredits: 1,
      targetVector: {
        kind: "tag",
        evidence: ["dsr08:corp_tag_punish"],
      },
      strategyId: "corp.tag_trace_punish",
    });
    const noWindowInput = strategicInput({
      side: "corp",
      snapshot: corpTagPunishSnapshot(),
      actions: [
        { ...punish, costs: [{ credits: 5 }] },
        gain,
      ],
      credits: 2,
      gripOrHq: [closedAccounts],
      runnerTags: 0,
      runnerCredits: 4,
      targetVector: {
        kind: "tag",
        evidence: ["dsr08:corp_tag_punish_no_window"],
      },
      strategyId: "corp.tag_trace_punish",
    });

    const tagged = chooseCorpAction(taggedInput);
    const noWindow = chooseCorpAction(noWindowInput);

    expect(tagged.actionId).toBe("closed-accounts");
    expect(tagged.evidence).toContain("semantic_strategic_action_fit:true");
    expect(noWindow.actionId).toBe("gain-credit");
    expect(noWindow.evidence).not.toContain("corp_tagged_runner_payoff_pressure");
  });

  it("keeps Corp scoreline terminal windows above setup, but avoids contestable advances", () => {
    const score = legalAction("score-agenda", "corp", "score_agenda", "Score");
    const gain = legalAction("gain-credit", "corp", "gain_credit", "Gain 1");
    const scoreInput = strategicInput({
      side: "corp",
      snapshot: corpRemoteScoringSnapshot(),
      actions: [score, gain],
      credits: 4,
      targetVector: {
        kind: "scoreline",
        evidence: ["dsr08:corp_scoreline"],
      },
      strategyId: "corp.remote_scoring",
    });
    const exposedAgenda = visibleCard("exposed-agenda", "corp", "agenda", {
      definitionId: "simple_agenda",
      title: "Simple Agenda",
      advancementRequirement: 3,
      advancementCounters: 1,
    });
    const contestableAdvance = legalAction(
      "advance-exposed-agenda",
      "corp",
      "advance_card",
      "Advance exposed agenda",
      {
        source: exposedAgenda.instanceId,
        payload: {
          serverId: "remote_1",
          sourceCardId: exposedAgenda.instanceId,
        },
      },
    );
    const contestableInput = strategicInput({
      side: "corp",
      snapshot: corpRemoteScoringSnapshot(),
      actions: [contestableAdvance, gain],
      credits: 4,
      servers: [
        server("hq"),
        server("rd"),
        server("archives"),
        server("remote_1", [], [exposedAgenda]),
      ],
      targetVector: {
        kind: "scoreline",
        evidence: ["dsr08:corp_scoreline_contestable_override"],
      },
      strategyId: "corp.remote_scoring",
    });

    const scoreDecision = chooseCorpAction(scoreInput);
    const contestableDecision = chooseCorpAction(contestableInput);

    expect(scoreDecision.actionId).toBe("score-agenda");
    expect(scoreDecision.evidence).toContain("semantic_strategic_action_fit:true");
    expect(contestableDecision.actionId).toBe("gain-credit");
  });

  it("uses ICE-tax defense when affordable and economy when the defensive line is unfunded", () => {
    const rez = legalAction("rez-ice", "corp", "rez_ice", "Rez Wall", {
      cost: 3,
    });
    const gain = legalAction("gain-credit", "corp", "gain_credit", "Gain 1");
    const fundedInput = strategicInput({
      side: "corp",
      snapshot: corpIceTaxSnapshot(),
      actions: [rez, gain],
      credits: 6,
      targetVector: {
        kind: "coverage",
        evidence: ["dsr08:corp_ice_tax"],
      },
      strategyId: "corp.ice_tax_glacier",
    });
    const unfundedInput = strategicInput({
      side: "corp",
      snapshot: corpIceTaxSnapshot(),
      actions: [
        legalAction("install-expensive-ice", "corp", "install_card", "Install ICE", {
          cost: 100,
          payload: { placement: "ice", serverId: "rd" },
        }),
        gain,
      ],
      credits: 2,
      targetVector: {
        kind: "coverage",
        evidence: ["dsr08:corp_ice_tax_unfunded"],
      },
      strategyId: "corp.ice_tax_glacier",
    });

    const funded = chooseCorpAction(fundedInput);
    const unfunded = chooseCorpAction(unfundedInput);

    expect(funded.actionId).toBe("rez-ice");
    expect(funded.evidence).toContain("semantic_strategic_action_fit:true");
    expect(unfunded.actionId).toBe("gain-credit");
  });

  it("runs Runner remote-contest windows but lets acute hand safety override pressure", () => {
    const runRemote = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { payload: { serverId: "remote_1" } },
    );
    const draw = legalAction("draw", "runner", "draw_card", "Draw");
    const remoteInput = strategicInput({
      side: "runner",
      snapshot: runnerRemoteContestSnapshot(),
      actions: [runRemote, draw],
      credits: 6,
      servers: [
        server("hq"),
        server("rd"),
        server("archives"),
        server("remote_1", [], [
          visibleCard("agenda", "corp", "agenda", {
            definitionId: "simple_agenda",
            title: "Simple Agenda",
          }),
        ]),
      ],
      targetVector: {
        kind: "remote",
        targetId: "remote_1",
        evidence: ["dsr08:runner_remote_contest"],
      },
      strategyId: "runner.remote_contest",
    });
    const safetyInput = strategicInput({
      side: "runner",
      snapshot: runnerRemoteContestSnapshot(),
      actions: [
        legalAction("run-rd", "runner", "start_run", "Run R&D", {
          payload: { serverId: "rd" },
        }),
        draw,
      ],
      credits: 3,
      gripOrHq: [],
      servers: [server("hq"), server("rd"), server("archives")],
      publicEvents: [
        publicEvent("damage-seen", "net_damage", 12, {
          actor: "corp",
          actionType: "net_damage",
          damageType: "net",
          sourceTitle: "Dedicated Response Team",
          sourceDefinitionId: "onr_v1_076_dedicated-response-team",
        }),
      ],
      targetVector: {
        kind: "remote",
        evidence: ["dsr08:runner_remote_safety_override"],
      },
      strategyId: "runner.remote_contest",
    });

    const remoteDecision = chooseRunnerAction(remoteInput);
    const safetyDecision = chooseRunnerAction(safetyInput);

    expect(remoteDecision.actionId).toBe("run-remote");
    expect(remoteDecision.evidence).toContain("semantic_strategic_action_fit:true");
    expect(safetyDecision.actionId).toBe("draw");
    expect(JSON.stringify(safetyDecision.decisionDebug)).toContain(
      "runner_hand_buffer_need",
    );
  });
});

function strategicInput(params: {
  side: Side;
  snapshot: AiDeckDoctrineDeckSnapshot;
  actions: LegalAction[];
  credits: number;
  servers?: PlayerView["servers"];
  gripOrHq?: VisibleCard[];
  publicEvents?: PublicGameEvent[];
  runnerTags?: number;
  runnerCredits?: number;
  targetVector: {
    kind:
      | "central"
      | "remote"
      | "scoreline"
      | "tag"
      | "damage"
      | "economy"
      | "coverage"
      | "survival"
      | "none";
    targetId?: string;
    evidence: string[];
  };
  strategyId?: string;
}): AiDecisionInputWithDeckCapabilities {
  const playerView = playerViewFor(params);
  const strategyProfile = params.strategyId
    ? productiveStrategyProfile(params.snapshot, params.strategyId)
    : buildDeckStrategyProfile(params.snapshot);
  const deckCapabilities = buildDeckCapabilityProfile({
    side: params.side,
    playerView,
    legalActions: params.actions,
    deckSnapshot: params.snapshot,
  });
  const strategicIntentState = buildStrategicIntentState({
    side: params.side,
    stateVersion: playerView.stateVersion,
    strategyProfile,
    deckCapabilities,
    availableCredits: params.credits,
    targetVector: params.targetVector,
  });
  const input: AiDecisionInput = {
    side: params.side,
    playerView,
    eventTail: params.publicEvents ?? [],
    legalActions: params.actions,
    difficulty: "normal",
    seed: "dsr08-strategic-vertical-slices",
    decisionId: `dsr08-${params.snapshot.deckSnapshotId}:1`,
    actionNumber: 1,
    profileId: `dsr08-${params.snapshot.deckSnapshotId}`,
  };
  return {
    ...input,
    ownDeckCapabilities: deckCapabilities,
    ownStrategicIntentState: strategicIntentState,
    ...(params.side === "runner"
      ? {
          ownRunnerStrategicIntent: buildRunnerStrategicIntentProfile({
            strategyProfile,
            deckCapabilities,
          }),
        }
      : {
          ownCorpStrategicIntent: buildCorpStrategicIntentProfile({
            strategyProfile,
            deckCapabilities,
            strategicIntentState,
          }),
        }),
  };
}

function playerViewFor(params: {
  side: Side;
  actions: LegalAction[];
  credits: number;
  servers?: PlayerView["servers"];
  gripOrHq?: VisibleCard[];
  publicEvents?: PublicGameEvent[];
  runnerTags?: number;
  runnerCredits?: number;
}): PlayerView {
  const runnerOwn = params.side === "runner";
  return {
    stateVersion: 1,
    side: params.side,
    activeSide: params.side,
    phase: params.side === "runner" ? "runner_action_phase" : "corp_action_phase",
    timingPoint: params.side === "runner" ? "runner_action.main" : "corp_action.main",
    own: {
      identity: visibleIdentity(params.side),
      credits: params.credits,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: params.gripOrHq ?? [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
      maxHandSize: 5,
      tags: runnerOwn ? (params.runnerTags ?? 0) : 0,
    },
    opponent: {
      identity: visibleIdentity(params.side === "runner" ? "corp" : "runner"),
      credits: runnerOwn ? 4 : (params.runnerCredits ?? 4),
      clicks: 3,
      agendaPoints: 0,
      tags: runnerOwn ? 0 : (params.runnerTags ?? 0),
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
      rig: [],
    },
    servers: params.servers ?? [server("hq"), server("rd"), server("archives")],
    publicEvents: params.publicEvents ?? [],
    legalActions: params.actions,
    winner: null,
    agendaPointsToWin: 7,
  };
}

function legalAction(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
  label: string,
  options: {
    cost?: number;
    source?: LegalAction["source"];
    payload?: LegalAction["payload"];
  } = {},
): LegalAction {
  return {
    actionId,
    side,
    type,
    label,
    source: options.source ?? "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [{ credits: options.cost ?? 0 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    ...(options.payload ? { payload: options.payload } : {}),
  };
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

function visibleCard(
  instanceId: string,
  owner: Side,
  cardType: VisibleCard["type"],
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  const { type: _ignoredType, ...safeOverrides } = overrides;
  return {
    instanceId,
    definitionId: overrides.definitionId ?? instanceId,
    title: overrides.title ?? instanceId,
    owner,
    controller: owner,
    type: cardType,
    known: true,
    ...safeOverrides,
  } as VisibleCard;
}

function visibleIdentity(side: Side): PlayerView["own"]["identity"] {
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

function publicEvent(
  eventId: string,
  type: PublicGameEvent["type"],
  stateVersionAfter: number,
  publicPayload: PublicGameEvent["publicPayload"],
): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload,
  };
}

function snapshot(
  deckSnapshotId: string,
  side: Side,
  cards: Array<[cardId: string, quantity: number]>,
): AiDeckDoctrineDeckSnapshot {
  return {
    deckSnapshotId,
    side,
    cards: cards.map(([cardId, quantity]) => ({ cardId, quantity })),
  };
}

function productiveStrategyProfile(
  snapshot: AiDeckDoctrineDeckSnapshot,
  strategyId: string,
): AiDeckStrategyProfile {
  const cardCount = snapshot.cards.reduce(
    (sum, card) => sum + Math.max(0, card.quantity),
    0,
  );
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: snapshot.deckSnapshotId,
    side: snapshot.side,
    cardCount,
    primaryStrategies: [strategyId],
    secondaryStrategies: [],
    strategyScores: {
      [strategyId]: {
        anchorScore: 80,
        supportScore: 80,
        finalScore: 80,
        confidence: "high",
        supportGaps: [],
        runtimeStatus: "productive",
        runtimeBlockers: [],
        anchorEvidence: [
          {
            cardId: snapshot.cards[0]?.cardId ?? "dsr08-anchor",
            quantity: 1,
            source: "derivedStrategyAnchor",
            strategyId,
            reason: "dsr08 vertical slice fixture",
          },
        ],
        supportEvidence: [],
      },
    },
    functionSignalCounts: {},
    legacySignalCounts: {},
    warnings: [],
    source: {
      mode: "diagnostic_only",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      compiledHints: "data/ai/ai-card-hints-compiled.json",
      inspectorIndex: "data/ai/ai-hint-inspector-index.json",
      plannerEffect: "none",
    },
  };
}

function runnerCentralPressureSnapshot(): AiDeckDoctrineDeckSnapshot {
  return snapshot("dsr08-runner-central-pressure", "runner", [
    ["onr_v1_081_custodial-position", 2],
    ["onr_v1_085_executive-wiretaps", 2],
    ["onr_v1_021_dwarf", 2],
    ["onr_v1_039_krash", 2],
    ["onr_v1_066_snowball", 2],
    ["onr_v1_108_score", 3],
  ]);
}

function runnerRemoteContestSnapshot(): AiDeckDoctrineDeckSnapshot {
  return snapshot("dsr08-runner-remote-contest", "runner", [
    ["onr_v1_156_corporate-ally", 2],
    ["onr_v1_173_restrictive-net-zoning", 2],
    ["onr_v1_021_dwarf", 2],
    ["onr_v1_039_krash", 2],
    ["onr_v1_066_snowball", 2],
    ["onr_v1_108_score", 3],
  ]);
}

function corpTagPunishSnapshot(): AiDeckDoctrineDeckSnapshot {
  return snapshot("dsr08-corp-tag-punish", "corp", [
    ["onr_v1_285_closed-accounts", 2],
    ["onr_v1_299_power-grid-overload", 2],
    ["onr_v1_249_hunter", 2],
    ["onr_v1_236_data-raven", 2],
    ["simple_economy_operation", 4],
  ]);
}

function corpRemoteScoringSnapshot(): AiDeckDoctrineDeckSnapshot {
  return snapshot("dsr08-corp-remote-scoring", "corp", [
    ["onr_v1_355_crystal-palace-station-grid", 2],
    ["onr_v1_279_wall-of-static", 3],
    ["simple_agenda", 4],
    ["simple_economy_operation", 4],
  ]);
}

function corpIceTaxSnapshot(): AiDeckDoctrineDeckSnapshot {
  return snapshot("dsr08-corp-ice-tax", "corp", [
    ["onr_v1_232_crystal-wall", 2],
    ["onr_v1_237_data-wall", 2],
    ["onr_v1_261_quandary", 2],
    ["onr_v1_279_wall-of-static", 2],
    ["onr_v1_317_data-masons", 2],
    ["simple_agenda", 3],
  ]);
}
