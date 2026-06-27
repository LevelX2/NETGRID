import { describe, expect, it } from "vitest";

import {
  buildDeckCapabilityProfile,
  redactedDeckCapabilityFacts,
} from "./deck-capabilities";
import type { AiDeckDoctrineDeckSnapshot } from "./deck-doctrine";
import type {
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";

describe("DeckCapabilityProfile", () => {
  it("builds runner breaker coverage, search access and bank tools from own deck facts", () => {
    const inputView = playerView("runner");
    inputView.own.memoryUsed = 3;
    inputView.own.memoryLimit = 4;
    inputView.own.rig = [
      visibleCard("codecracker-1", "onr_v1_014_codecracker", "runner", "program", {
        title: "Codecracker",
        subtypes: ["icebreaker"],
        memoryCost: 1,
      }),
      visibleCard("smc-1", "onr_v1_059_self-modifying-code", "runner", "program", {
        title: "Self-Modifying Code",
        memoryCost: 2,
      }),
      visibleCard("broker-1", "onr_v1_154_broker", "runner", "resource", {
        title: "Broker",
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 3,
            displayKind: "stored_credits",
            label: "3",
            ariaLabel: "3 gespeicherte Credits",
            usageHint: "spendable",
          },
        ],
      }),
    ];
    const legalActions = [
      legalAction("smc-search", "runner", "trigger_ability", "smc-1", "Self-Modifying Code: search your stack for a program"),
      legalAction(
        "broker-build",
        "runner",
        "trigger_ability",
        "broker-1",
        "Use ability",
        { cardImplementationAddsHostedCredits: true },
      ),
      legalAction(
        "broker-cash",
        "runner",
        "trigger_ability",
        "broker-1",
        "Use ability",
        { cardImplementationTakesHostedCredits: true },
      ),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions,
      deckSnapshot: runnerSnapshot([
        ["onr_v1_014_codecracker", 1],
        ["onr_v1_021_dwarf", 2],
        ["onr_v1_059_self-modifying-code", 1],
        ["onr_v1_154_broker", 1],
      ]),
    });

    expect(profile.runner?.breakerInventory.map((entry) => entry.cardId)).toEqual([
      "onr_v1_014_codecracker",
      "onr_v1_021_dwarf",
    ]);
    expect(profile.runner?.breakerCoverageMatrix.code_gate.installed).toBe(true);
    expect(profile.runner?.breakerCoverageMatrix.wall.inDeckKnown).toBe(true);
    expect(profile.runner?.breakerCoverageMatrix.wall.searchableNow).toBe(true);
    expect(profile.runner?.searchAccess.canSearchProgramsNow).toBe(true);
    expect(profile.runner?.economyBankTools[0]).toMatchObject({
      cardId: "onr_v1_154_broker",
      status: "installed",
      currentBankAmount: 3,
      buildActionLegal: true,
      cashOutActionLegal: true,
      buildActionIds: ["broker-build"],
      cashOutActionIds: ["broker-cash"],
    });
    expect(profile.runner?.memoryProfile).toMatchObject({
      memoryUsed: 3,
      memoryLimit: 4,
      memoryAvailable: 1,
    });
  });

  it("uses structured hosted-credit payloads and ignores label-only bank actions", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("broker-1", "onr_v1_154_broker", "runner", "resource", {
        title: "Broker",
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 3,
            displayKind: "stored_credits",
            label: "3",
            ariaLabel: "3 gespeicherte Credits",
            usageHint: "spendable",
          },
        ],
      }),
    ];

    const labelOnly = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [
        legalAction("label-build", "runner", "trigger_ability", "broker-1", "Auf Broker legen"),
        legalAction("label-cash", "runner", "trigger_ability", "broker-1", "Von Broker nehmen"),
      ],
      deckSnapshot: runnerSnapshot([["onr_v1_154_broker", 1]]),
    });

    expect(labelOnly.runner?.economyBankTools[0]).toMatchObject({
      buildActionLegal: false,
      cashOutActionLegal: false,
      buildActionIds: [],
      cashOutActionIds: [],
    });

    const structured = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [
        legalAction(
          "structured-build",
          "runner",
          "trigger_ability",
          "broker-1",
          "Use ability",
          { cardImplementationAddsHostedCredits: true },
        ),
        legalAction(
          "structured-cash",
          "runner",
          "trigger_ability",
          "broker-1",
          "Use ability",
          { cardImplementationTakesHostedCredits: true },
        ),
      ],
      deckSnapshot: runnerSnapshot([["onr_v1_154_broker", 1]]),
    });

    expect(structured.runner?.economyBankTools[0]).toMatchObject({
      buildActionLegal: true,
      cashOutActionLegal: true,
      buildActionIds: ["structured-build"],
      cashOutActionIds: ["structured-cash"],
    });
  });

  it("marks missing runner coverage without guessing unavailable deck answers", () => {
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: playerView("runner"),
      legalActions: [legalAction("draw", "runner", "draw_card", "basic_action", "Draw")],
      deckSnapshot: runnerSnapshot([["onr_v1_021_dwarf", 1]]),
    });

    expect(profile.runner?.breakerCoverageMatrix.wall.inDeckKnown).toBe(true);
    expect(profile.runner?.breakerCoverageMatrix.trace.missing).toBe(true);
    expect(profile.missingCapabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capabilityId: "runner.trace_coverage",
          severity: "hard",
        }),
      ]),
    );
  });

  it("redacts deck facts for debug output", () => {
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: playerView("runner"),
      legalActions: [],
      deckSnapshot: runnerSnapshot([
        ["onr_v1_014_codecracker", 1],
        ["onr_v1_021_dwarf", 1],
        ["onr_v1_154_broker", 1],
      ]),
    });

    const facts = redactedDeckCapabilityFacts(profile);

    expect(facts).toEqual(
      expect.arrayContaining([
        "breaker.wall=in_deck/draw_only",
        "breaker.code_gate=in_deck/draw_only",
        "bank_tool_count:1",
      ]),
    );
    expect(facts.join("\n")).not.toMatch(/onr_v1_|Codecracker|Dwarf|Broker/);
  });

  it("marks text-only capability detection as transition fallback evidence", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("fallback-breaker-1", "local_text_only_breaker", "runner", "program", {
        title: "Local Text Breaker",
        rulesText: "Break one ice subroutine.",
      }),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [],
    });

    expect(profile.evidence).toContain(
      "capability_source_priority:structured>roles>visible_board>text_fallback",
    );
    expect(profile.runner?.breakerInventory[0]).toMatchObject({
      cardId: "local_text_only_breaker",
      confidence: "low",
      evidence: expect.arrayContaining([
        "capability_source:text_fallback",
        "text_fallback:transition_only",
      ]),
    });
  });
});

function runnerSnapshot(
  cards: Array<[cardId: string, quantity: number]>,
): AiDeckDoctrineDeckSnapshot {
  return {
    deckSnapshotId: "deck-capability-test-runner",
    side: "runner",
    cards: cards.map(([cardId, quantity]) => ({ cardId, quantity })),
  };
}

function playerView(side: Side): PlayerView {
  const opponentSide = side === "runner" ? "corp" : "runner";
  return {
    stateVersion: 1,
    side,
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    own: {
      identity: visibleIdentity(side),
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
      identity: visibleIdentity(opponentSide),
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
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
  };
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

function visibleCard(
  instanceId: string,
  definitionId: string,
  side: Side,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Omit<
    Partial<VisibleCard>,
    "instanceId" | "definitionId" | "owner" | "controller" | "type" | "known"
  > = {},
): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: definitionId,
    owner: side,
    controller: side,
    type,
    known: true,
    ...overrides,
  };
}

function legalAction(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
  source: LegalAction["source"],
  label: string,
  payload?: LegalAction["payload"],
): LegalAction {
  const action: LegalAction = {
    actionId,
    side,
    type,
    label,
    source,
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  };
  if (payload) action.payload = payload;
  return action;
}
