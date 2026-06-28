import { describe, expect, it } from "vitest";
import type { LegalAction, PlayerView, Side, VisibleCard } from "@netgrid/shared";
import type {
  BreakerCoverageKind,
  CoverageState,
  DeckCapabilityProfile,
} from "../deck-capabilities";
import type {
  AiDeckStrategyProfile,
  DeckStrategyRuntimeStatus,
  DeckStrategyScore,
} from "../deck-doctrine-strategy";
import {
  buildStrategicRuntimeContext,
  targetOpportunityBonus,
} from "./strategic-runtime-context";

describe("strategic runtime context", () => {
  it("derives Runner roles, central target and reserve from runtime facts", () => {
    const context = buildStrategicRuntimeContext({
      side: "runner",
      playerView: playerView("runner", { credits: 3 }),
      legalActions: [
        action("run-rd", "runner", "start_run", 2, { serverId: "rd" }),
        action("draw", "runner", "draw_card", 0),
      ],
      strategyProfile: strategyProfile("runner", "runner.rnd_pressure"),
      deckCapabilities: runnerCapabilities({
        wall: coverage({ missing: true }),
        code_gate: coverage({ inDeckKnown: true, drawOnly: true }),
        sentry: coverage({ installed: true }),
      }),
    });

    expect(context.targetVector).toMatchObject({
      kind: "central",
      targetId: "rd",
    });
    expect(context.targetVector.evidence).toContain(
      "target_source:runtime_context",
    );
    expect(context.reserveRequirement).toMatchObject({
      kind: "credits",
      required: 4,
      available: 3,
      satisfied: false,
    });
    expect(context.roleStatuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          roleId: "runner.breaker.wall",
          status: "absent",
          source: "capability",
        }),
        expect.objectContaining({
          roleId: "runner.breaker.code_gate",
          status: "in_deck_unseen",
        }),
        expect.objectContaining({
          roleId: "runner.breaker.sentry",
          status: "active",
        }),
      ]),
    );
  });

  it("derives Corp score window, scoreline target and reserve from runtime facts", () => {
    const context = buildStrategicRuntimeContext({
      side: "corp",
      playerView: playerView("corp", {
        credits: 6,
        servers: [
          server("hq"),
          server("rd"),
          server("archives"),
          server("remote_1", [], [
            visibleCard("agenda-remote", "corp", "agenda", {
              advancementRequirement: 3,
            }),
          ]),
        ],
      }),
      legalActions: [
        action("score", "corp", "score_agenda", 1),
        action("advance", "corp", "advance_card", 1),
      ],
      strategyProfile: strategyProfile("corp", "corp.remote_scoring"),
      deckCapabilities: corpCapabilities(),
    });

    expect(context.targetVector).toMatchObject({ kind: "scoreline" });
    expect(context.roleStatuses).toContainEqual(
      expect.objectContaining({
        roleId: "corp.score_window",
        status: "active",
        source: "player_view",
      }),
    );
    expect(context.reserveRequirement).toMatchObject({
      kind: "credits",
      required: 5,
      available: 6,
      satisfied: true,
    });
    expect(context.reserveRequirement.evidence).toEqual(
      expect.arrayContaining([
        "reserve_source:runtime_context",
        "relevant_action_min_cost:1",
      ]),
    );
  });

  it("selects a concrete board opportunity while retaining the strategy portfolio", () => {
    const context = buildStrategicRuntimeContext({
      side: "corp",
      playerView: playerView("corp", {
        credits: 8,
        servers: [
          server("hq"),
          server("rd"),
          server("archives"),
          server("remote_1", [], [
            visibleCard("agenda-remote", "corp", "agenda", {
              advancementRequirement: 3,
            }),
          ]),
        ],
      }),
      legalActions: [
        action("score", "corp", "score_agenda", 1),
        action("install-ice", "corp", "install_card", 3, { placement: "ice" }),
      ],
      strategyProfile: multiStrategyProfile("corp", {
        primary: ["corp.ice_tax_glacier", "corp.remote_scoring"],
        scores: {
          "corp.ice_tax_glacier": score("corp.ice_tax_glacier", {
            final: 88,
            anchor: 85,
            support: 80,
          }),
          "corp.remote_scoring": score("corp.remote_scoring", {
            final: 78,
            anchor: 78,
            support: 80,
          }),
        },
      }),
      deckCapabilities: corpCapabilities(),
    });

    expect(context.strategyPortfolio.activeStrategyId).toBe(
      "corp.remote_scoring",
    );
    expect(context.targetVector.kind).toBe("scoreline");
    expect(
      context.strategyPortfolio.productiveCandidates.map(
        (candidate) => candidate.strategyId,
      ),
    ).toEqual(["corp.remote_scoring", "corp.ice_tax_glacier"]);
  });

  it("keeps blocked strategy candidates out of active selection", () => {
    const context = buildStrategicRuntimeContext({
      side: "corp",
      playerView: playerView("corp", {
        credits: 8,
        servers: [server("hq"), server("rd"), server("archives")],
      }),
      legalActions: [action("score", "corp", "score_agenda", 1)],
      strategyProfile: multiStrategyProfile("corp", {
        primary: ["corp.tag_trace_punish", "corp.remote_scoring"],
        scores: {
          "corp.tag_trace_punish": score("corp.tag_trace_punish", {
            final: 99,
            anchor: 99,
            support: 99,
            runtimeStatus: "blocked",
            runtimeBlockers: ["missing_tag_payoff"],
          }),
          "corp.remote_scoring": score("corp.remote_scoring", {
            final: 62,
            anchor: 62,
            support: 70,
          }),
        },
      }),
      deckCapabilities: corpCapabilities(),
    });

    expect(context.strategyPortfolio.activeStrategyId).toBe(
      "corp.remote_scoring",
    );
    expect(
      context.strategyPortfolio.blockedCandidates.map(
        (candidate) => candidate.strategyId,
      ),
    ).toContain("corp.tag_trace_punish");
  });

  it("scores target opportunity evidence by exact flags", () => {
    expect(
      targetOpportunityBonus({
        kind: "scoreline",
        evidence: ["legal_score:true"],
      }),
    ).toBe(30);
    expect(
      targetOpportunityBonus({
        kind: "scoreline",
        evidence: ["not_legal_score:true_noise", "legal_advance:trueish_noise"],
      }),
    ).toBe(0);
    expect(
      targetOpportunityBonus({
        kind: "damage",
        evidence: ["not_target_reason:no_visible_semantic_noise"],
      }),
    ).toBe(18);
    expect(
      targetOpportunityBonus({
        kind: "damage",
        evidence: ["target_reason:no_visible_semantic"],
      }),
    ).toBe(0);
    expect(
      targetOpportunityBonus({
        kind: "remote",
        evidence: ["not_target_legal_run:none_noise"],
      }),
    ).toBe(10);
    expect(
      targetOpportunityBonus({
        kind: "remote",
        evidence: ["target_legal_run:none"],
      }),
    ).toBe(0);
  });
});

function strategyProfile(
  side: Side,
  strategyId: "runner.rnd_pressure" | "corp.remote_scoring",
): AiDeckStrategyProfile {
  return multiStrategyProfile(side, {
    primary: [strategyId],
    scores: {
      [strategyId]: score(strategyId),
    },
  });
}

function multiStrategyProfile(
  side: Side,
  params: {
    primary: string[];
    secondary?: string[];
    scores: Record<string, DeckStrategyScore>;
  },
): AiDeckStrategyProfile {
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: `${side}-runtime-context`,
    side,
    cardCount: 8,
    strategyScores: params.scores,
    primaryStrategies: params.primary,
    secondaryStrategies: params.secondary ?? [],
    functionSignalCounts: {},
    legacySignalCounts: {},
    warnings: [],
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      compiledHints: "data/ai/ai-card-hints-compiled.json",
      inspectorIndex: "data/ai/ai-hint-inspector-index.json",
      plannerEffect: "strategic_intent_input",
    },
  };
}

function score(
  strategyId: string,
  params: {
    anchor?: number;
    support?: number;
    final?: number;
    runtimeStatus?: DeckStrategyRuntimeStatus;
    runtimeBlockers?: string[];
  } = {},
): DeckStrategyScore {
  const anchor = params.anchor ?? 80;
  const support = params.support ?? 80;
  const final = params.final ?? 80;
  return {
    anchorScore: anchor,
    supportScore: support,
    finalScore: final,
    confidence: "high",
    runtimeStatus: params.runtimeStatus ?? "productive",
    runtimeBlockers: params.runtimeBlockers ?? [],
    supportGaps: [],
    anchorEvidence: [
      {
        cardId: "fixture-anchor",
        quantity: 1,
        source: "derivedStrategyAnchor",
        strategyId,
        reason: "test",
      },
    ],
    supportEvidence: [],
  };
}

function runnerCapabilities(
  overrides: Partial<Record<BreakerCoverageKind, CoverageState>>,
): DeckCapabilityProfile {
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "runner",
    runner: {
      breakerInventory: [],
      breakerCoverageMatrix: {
        wall: coverage(overrides.wall),
        code_gate: coverage(overrides.code_gate),
        sentry: coverage(overrides.sentry),
        ap: coverage(overrides.ap),
        trace: coverage(overrides.trace),
        universal: coverage(overrides.universal),
        subtype_limited: coverage(overrides.subtype_limited),
        special: coverage(overrides.special),
      },
      searchAccess: {
        tools: [],
        canSearchProgramsNow: false,
        canSearchBreakersNow: false,
        evidence: [],
      },
      economyBankTools: [],
      memoryProfile: {
        memoryToolsKnown: 0,
        missingMemoryPressure: false,
        evidence: [],
      },
      attackPlanProfile: {
        centralPressureToolsKnown: 1,
        remoteContestToolsKnown: 0,
        setupToolsKnown: 0,
        evidence: [],
      },
    },
    missingCapabilities: [],
    confidence: "high",
    evidence: ["test"],
  };
}

function coverage(overrides: Partial<CoverageState> = {}): CoverageState {
  return {
    coverage: "wall",
    inDeckKnown: false,
    inHand: false,
    installed: false,
    searchableNow: false,
    drawOnly: false,
    missing: false,
    bestKnownCards: [],
    blockers: [],
    ...overrides,
  };
}

function corpCapabilities(): DeckCapabilityProfile {
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "corp",
    corp: {
      scorePlanProfile: {
        agendaToolsKnown: 2,
        advanceToolsKnown: 1,
        scoreSupportToolsKnown: 2,
        evidence: ["score_support:true"],
      },
      rezReserveProfile: {
        iceKnownInDeck: 3,
        rezEconomyToolsKnown: 1,
        evidence: ["ice:true"],
      },
      economyBankTools: [],
      iceTaxProfile: {
        barrierIceKnown: 1,
        codeGateIceKnown: 1,
        sentryIceKnown: 1,
        taxingIceKnown: 0,
        evidence: [],
      },
      remotePlanProfile: {
        remoteProtectionToolsKnown: 1,
        remoteEconomyToolsKnown: 0,
        ambushToolsKnown: 0,
        evidence: [],
      },
    },
    missingCapabilities: [],
    confidence: "high",
    evidence: ["test"],
  };
}

function playerView(
  side: Side,
  options: {
    credits: number;
    servers?: PlayerView["servers"];
  },
): PlayerView {
  return {
    side,
    stateVersion: 5,
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    own: {
      identity: visibleCard(`${side}-identity`, side, "identity"),
      credits: options.credits,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleCard(`${side}-opponent`, side === "runner" ? "corp" : "runner", "identity"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
      rig: [],
    },
    servers: options.servers ?? [server("hq"), server("rd"), server("archives")],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
  } as PlayerView;
}

function action(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
  credits: number,
  payload?: LegalAction["payload"],
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [{ credits }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 6,
    ...(payload ? { payload } : {}),
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  ice: VisibleCard[] = [],
  root: VisibleCard[] = [],
): PlayerView["servers"][number] {
  return { id, label: id, ice, root };
}

function visibleCard(
  instanceId: string,
  owner: Side,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    known: true,
    owner,
    controller: owner,
    type,
    ...overrides,
  };
}
