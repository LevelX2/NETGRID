import { describe, expect, it } from "vitest";

import {
  buildDeckCapabilityProfile,
  redactedDeckCapabilityFacts,
} from "./deck-capabilities";
import { CARD_ROLES_BY_CARD } from "./ai-hints";
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

  it("requires source evidence before marking search tools legal now", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("smc-1", "onr_v1_059_self-modifying-code", "runner", "program", {
        title: "Self-Modifying Code",
        memoryCost: 2,
      }),
    ];

    const labelOnly = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [
        legalAction(
          "label-only-search",
          "runner",
          "trigger_ability",
          "other-source",
          "Self-Modifying Code: search your stack for a program",
        ),
      ],
      deckSnapshot: runnerSnapshot([["onr_v1_059_self-modifying-code", 1]]),
    });

    expect(labelOnly.runner?.searchAccess.canSearchProgramsNow).toBe(false);
    expect(labelOnly.runner?.searchAccess.tools[0]).toMatchObject({
      cardId: "onr_v1_059_self-modifying-code",
      legalNow: false,
    });

    const sourced = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [
        legalAction(
          "sourced-search",
          "runner",
          "trigger_ability",
          "smc-1",
          "Use ability",
        ),
      ],
      deckSnapshot: runnerSnapshot([["onr_v1_059_self-modifying-code", 1]]),
    });

    expect(sourced.runner?.searchAccess.canSearchProgramsNow).toBe(true);
    expect(sourced.runner?.searchAccess.tools[0]).toMatchObject({
      cardId: "onr_v1_059_self-modifying-code",
      legalNow: true,
    });
  });

  it("matches search access roles by bounded role terms", () => {
    CARD_ROLES_BY_CARD.set("local_structured_search", {
      cardId: "local_structured_search",
      side: "runner",
      roles: ["setup_program_search"],
    });
    CARD_ROLES_BY_CARD.set("local_noise_tool", {
      cardId: "local_noise_tool",
      side: "runner",
      roles: ["program_searchish_noise", "searchlight_noise"],
    });
    try {
      const inputView = playerView("runner");
      inputView.own.gripOrHq = [
        visibleCard("search-1", "local_structured_search", "runner", "program", {
          title: "Structured Search",
        }),
        visibleCard("noise-1", "local_noise_tool", "runner", "program", {
          title: "Noise Tool",
        }),
      ];

      const profile = buildDeckCapabilityProfile({
        side: "runner",
        playerView: inputView,
        legalActions: [],
      });

      expect(profile.runner?.searchAccess.tools.map((tool) => tool.cardId))
        .toEqual(["local_structured_search"]);
      expect(profile.runner?.searchAccess.tools[0]?.evidence).toContain(
        "capability_source:structured",
      );
    } finally {
      CARD_ROLES_BY_CARD.delete("local_structured_search");
      CARD_ROLES_BY_CARD.delete("local_noise_tool");
    }
  });

  it("matches breaker capability roles by bounded role prefixes", () => {
    CARD_ROLES_BY_CARD.set("local_structured_breaker", {
      cardId: "local_structured_breaker",
      side: "runner",
      roles: ["breaker_fracter"],
    });
    CARD_ROLES_BY_CARD.set("local_noise_breaker", {
      cardId: "local_noise_breaker",
      side: "runner",
      roles: ["breakerish_fracter"],
    });
    try {
      const inputView = playerView("runner");
      inputView.own.gripOrHq = [
        visibleCard("structured-breaker-1", "local_structured_breaker", "runner", "program", {
          title: "Structured Breaker",
        }),
        visibleCard("noise-breaker-1", "local_noise_breaker", "runner", "program", {
          title: "Noise Breaker",
          rulesText: "Break one ice subroutine.",
        }),
      ];

      const profile = buildDeckCapabilityProfile({
        side: "runner",
        playerView: inputView,
        legalActions: [],
      });

      expect(profile.runner?.breakerInventory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            cardId: "local_structured_breaker",
            confidence: "medium",
            evidence: expect.arrayContaining(["capability_source:role_or_subtype"]),
          }),
          expect.objectContaining({
            cardId: "local_noise_breaker",
            confidence: "low",
            evidence: expect.arrayContaining([
              "capability_source:text_fallback",
              "text_fallback:transition_only",
            ]),
          }),
        ]),
      );
    } finally {
      CARD_ROLES_BY_CARD.delete("local_structured_breaker");
      CARD_ROLES_BY_CARD.delete("local_noise_breaker");
    }
  });

  it("matches corp plan roles by bounded role terms", () => {
    CARD_ROLES_BY_CARD.set("local_plan_a", {
      cardId: "local_plan_a",
      side: "corp",
      roles: ["remote_score_support"],
    });
    CARD_ROLES_BY_CARD.set("local_plan_b", {
      cardId: "local_plan_b",
      side: "corp",
      roles: ["protect_remote"],
    });
    CARD_ROLES_BY_CARD.set("local_plan_c", {
      cardId: "local_plan_c",
      side: "corp",
      roles: ["remote_economy_asset"],
    });
    CARD_ROLES_BY_CARD.set("local_plan_d", {
      cardId: "local_plan_d",
      side: "corp",
      roles: ["remote_ambush"],
    });
    CARD_ROLES_BY_CARD.set("local_plan_e", {
      cardId: "local_plan_e",
      side: "corp",
      roles: [
        "scoreish_noise",
        "remoteish_noise",
        "economy_assetish_noise",
        "ambushish_noise",
      ],
    });
    try {
      const inputView = playerView("corp");
      inputView.servers = [
        server("remote_1", [
          visibleCard("plan-a", "local_plan_a", "corp", "operation", {
            title: "Structured Plan A",
          }),
          visibleCard("plan-b", "local_plan_b", "corp", "upgrade", {
            title: "Structured Plan B",
          }),
          visibleCard("plan-c", "local_plan_c", "corp", "asset", {
            title: "Structured Plan C",
          }),
          visibleCard("plan-d", "local_plan_d", "corp", "asset", {
            title: "Structured Plan D",
          }),
          visibleCard("plan-e", "local_plan_e", "corp", "asset", {
            title: "Role Noise",
          }),
        ]),
      ];

      const profile = buildDeckCapabilityProfile({
        side: "corp",
        playerView: inputView,
        legalActions: [],
      });

      expect(profile.corp?.scorePlanProfile.scoreSupportToolsKnown).toBe(1);
      expect(profile.corp?.remotePlanProfile).toMatchObject({
        remoteProtectionToolsKnown: 4,
        remoteEconomyToolsKnown: 1,
        ambushToolsKnown: 1,
      });
    } finally {
      CARD_ROLES_BY_CARD.delete("local_plan_a");
      CARD_ROLES_BY_CARD.delete("local_plan_b");
      CARD_ROLES_BY_CARD.delete("local_plan_c");
      CARD_ROLES_BY_CARD.delete("local_plan_d");
      CARD_ROLES_BY_CARD.delete("local_plan_e");
    }
  });

  it("matches runner attack plan roles by bounded role terms", () => {
    CARD_ROLES_BY_CARD.set("local_runner_attack_a", {
      cardId: "local_runner_attack_a",
      side: "runner",
      roles: ["interface_multiaccess"],
    });
    CARD_ROLES_BY_CARD.set("local_runner_attack_b", {
      cardId: "local_runner_attack_b",
      side: "runner",
      roles: ["remote_contest_tool"],
    });
    CARD_ROLES_BY_CARD.set("local_runner_attack_c", {
      cardId: "local_runner_attack_c",
      side: "runner",
      roles: ["early_setup"],
    });
    CARD_ROLES_BY_CARD.set("local_runner_attack_noise", {
      cardId: "local_runner_attack_noise",
      side: "runner",
      roles: [
        "multiaccessory_noise",
        "remote_contestish_noise",
        "setupish_noise",
      ],
    });
    try {
      const inputView = playerView("runner");
      inputView.own.gripOrHq = [
        visibleCard("attack-a", "local_runner_attack_a", "runner", "event", {
          title: "Attack Plan A",
        }),
        visibleCard("attack-b", "local_runner_attack_b", "runner", "event", {
          title: "Attack Plan B",
        }),
        visibleCard("attack-c", "local_runner_attack_c", "runner", "hardware", {
          title: "Attack Plan C",
        }),
        visibleCard("attack-noise", "local_runner_attack_noise", "runner", "event", {
          title: "Attack Noise",
        }),
      ];

      const profile = buildDeckCapabilityProfile({
        side: "runner",
        playerView: inputView,
        legalActions: [],
      });

      expect(profile.runner?.attackPlanProfile).toMatchObject({
        centralPressureToolsKnown: 1,
        remoteContestToolsKnown: 1,
        setupToolsKnown: 1,
      });
    } finally {
      CARD_ROLES_BY_CARD.delete("local_runner_attack_a");
      CARD_ROLES_BY_CARD.delete("local_runner_attack_b");
      CARD_ROLES_BY_CARD.delete("local_runner_attack_c");
      CARD_ROLES_BY_CARD.delete("local_runner_attack_noise");
    }
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

    const facts = redactedDeckCapabilityFacts({
      ...profile,
      missingCapabilities: [
        ...profile.missingCapabilities,
        {
          capabilityId: "runner.synthetic_coverage",
          kind: "synthetic_coverage",
          severity: "hard",
          evidence: ["test"],
        },
        {
          capabilityId: "runner.coverageish_noise",
          kind: "coverageish_noise",
          severity: "hard",
          evidence: ["test"],
        },
      ],
    });

    expect(facts).toEqual(
      expect.arrayContaining([
        "breaker.wall=in_deck/draw_only",
        "breaker.code_gate=in_deck/draw_only",
        "bank_tool_count:1",
        "missing:synthetic_coverage",
      ]),
    );
    expect(facts).not.toContain("missing:coverageish_noise");
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

function server(
  id: PlayerView["servers"][number]["id"],
  root: VisibleCard[],
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice: [],
    root,
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
