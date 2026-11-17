import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import { describe, expect, it, vi } from "vitest";

import {
  buildDeckCapabilityProfile,
  redactedDeckCapabilityFacts,
} from "./deck-capabilities";
import { AI_HINTS_BY_CARD as mockedHints, type AiCardHint } from "./ai-hints";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import type {
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";

vi.mock(import("./ai-hints"), async (importOriginal) => {
  const actual = await importOriginal();
  const hints = actual.createAiHintsByCard();
  return {
    ...actual,
    AI_HINTS_BY_CARD: hints,
    createAiHintsByCard: () => new Map(hints),
  };
});

const AI_HINTS_BY_CARD = mockedHints as Map<number, AiCardHint>;

describe("DeckCapabilityProfile", () => {
  it("builds runner breaker coverage, search access and bank tools from own deck facts", () => {
    const inputView = playerView("runner");
    inputView.own.memoryUsed = 3;
    inputView.own.memoryLimit = 4;
    inputView.own.rig = [
      visibleCard(
        "codecracker-1",
        226,
        "runner",
        "program",
        {
          title: "Codecracker",
          subtypes: ["icebreaker"],
          memoryCost: 1,
        },
      ),
      visibleCard(
        "smc-1",
        271,
        "runner",
        "program",
        {
          title: "Self-Modifying Code",
          memoryCost: 2,
        },
      ),
      visibleCard("broker-1", 366, "runner", "resource", {
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
      legalAction(
        "smc-search",
        "runner",
        "trigger_ability",
        "smc-1",
        "Self-Modifying Code: search your stack for a program",
      ),
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
        [226, 1],
        [233, 2],
        [271, 1],
        [366, 1],
      ]),
    });

    expect(
      profile.runner?.breakerInventory.map((entry) => entry.cardId),
    ).toEqual([226, 233]);
    expect(profile.runner?.breakerCoverageMatrix.code_gate.installed).toBe(
      true,
    );
    expect(profile.runner?.breakerCoverageMatrix.wall.inDeckKnown).toBe(true);
    expect(profile.runner?.breakerCoverageMatrix.wall.searchableNow).toBe(true);
    expect(profile.runner?.searchAccess.canSearchProgramsNow).toBe(true);
    expect(profile.runner?.economyBankTools[0]).toMatchObject({
      cardId: 366,
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

  it("bounds memory tool text signals to exact tokens", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("memory-1", syntheticCardDefinitionId("local_memory_tool"), "runner", "hardware", {
        title: "Memory Tool",
      }),
      visibleCard(
        "municipal-1",
        syntheticCardDefinitionId("local_municipal_noise"),
        "runner",
        "hardware",
        {
          title: "Municipal Tool",
          rulesText: "MUish support.",
        },
      ),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [],
    });

    expect(profile.runner?.memoryProfile.memoryToolsKnown).toBe(1);
  });

  it("does not classify run-only temporary credits as a persistent economy bank", () => {
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: playerView("runner"),
      legalActions: [],
      deckSnapshot: runnerSnapshot([
        [310, 1],
        [366, 1],
      ]),
    });

    expect(profile.runner?.economyBankTools.map((tool) => tool.cardId)).toEqual(
      [366],
    );
  });

  it("uses structured hosted-credit payloads and ignores label-only bank actions", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("broker-1", 366, "runner", "resource", {
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
        legalAction(
          "label-build",
          "runner",
          "trigger_ability",
          "broker-1",
          "Auf Broker legen",
        ),
        legalAction(
          "label-cash",
          "runner",
          "trigger_ability",
          "broker-1",
          "Von Broker nehmen",
        ),
      ],
      deckSnapshot: runnerSnapshot([[366, 1]]),
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
      deckSnapshot: runnerSnapshot([[366, 1]]),
    });

    expect(structured.runner?.economyBankTools[0]).toMatchObject({
      buildActionLegal: true,
      cashOutActionLegal: true,
      buildActionIds: ["structured-build"],
      cashOutActionIds: ["structured-cash"],
    });
  });

  it("keeps individual bank amounts and payout size distinct in a portfolio", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("broker-1", 366, "runner", "resource", {
        title: "Broker",
        counterDisplays: [
          {
            id: "broker-bank-1",
            amount: 12,
            displayKind: "stored_credits",
            label: "12",
            ariaLabel: "12 gespeicherte Credits",
            usageHint: "spendable",
          },
        ],
      }),
      visibleCard("broker-2", 366, "runner", "resource", {
        title: "Broker",
        counterDisplays: [
          {
            id: "broker-bank-2",
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
      legalAction(
        "broker-1-build",
        "runner",
        "trigger_ability",
        "broker-1",
        "Use ability",
        {
          cardImplementationAddsHostedCredits: true,
        },
      ),
      legalAction(
        "broker-2-build",
        "runner",
        "trigger_ability",
        "broker-2",
        "Use ability",
        {
          cardImplementationAddsHostedCredits: true,
        },
      ),
      legalAction(
        "broker-1-cash",
        "runner",
        "trigger_ability",
        "broker-1",
        "Use ability",
        {
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 2,
          gainCreditsAmount: 2,
        },
      ),
      legalAction(
        "broker-2-cash",
        "runner",
        "trigger_ability",
        "broker-2",
        "Use ability",
        {
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 2,
          gainCreditsAmount: 2,
        },
      ),
    ];
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions,
      deckSnapshot: runnerSnapshot([[366, 2]]),
    });

    expect(profile.runner?.economyBankTools).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: "broker-1",
        currentBankAmount: 12,
        currentBankAmounts: [12],
        portfolioStoredAmount: 12,
        estimatedPayout: 2,
        buildActionIds: ["broker-1-build"],
        cashOutActionIds: ["broker-1-cash"],
      }),
      expect.objectContaining({
        sourceCardInstanceId: "broker-2",
        currentBankAmount: 3,
        currentBankAmounts: [3],
        portfolioStoredAmount: 3,
        estimatedPayout: 2,
        buildActionIds: ["broker-2-build"],
        cashOutActionIds: ["broker-2-cash"],
      }),
    ]);
  });

  it("does not create Runner credit-bank tools from card text", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard(
        "stored-credits-1",
        syntheticCardDefinitionId("local_stored_credits_tool"),
        "runner",
        "resource",
        {
          title: "Stored Credits Tool",
        },
      ),
      visibleCard(
        "stored-noise-1",
        syntheticCardDefinitionId("local_stored_noise_tool"),
        "runner",
        "resource",
        {
          title: "Stored Creditsish Tool",
        },
      ),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [],
    });

    expect(profile.runner?.economyBankTools).toEqual([]);
  });

  it("recognizes a canonical build action with automatic installment cashout", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard(
        "streetware-1",
        208,
        "runner",
        "resource",
        { title: "Streetware Distributor" },
      ),
    ];
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [
        legalAction(
          "streetware-build",
          "runner",
          "activated_card_ability",
          "streetware-1",
          "Streetware Distributor: 3 Credits auflegen",
          { cardImplementationAddsHostedCredits: true },
        ),
      ],
    });

    expect(profile.runner?.economyBankTools).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: "streetware-1",
        buildActionLegal: true,
        buildActionIds: ["streetware-build"],
        cashOutActionLegal: false,
      }),
    ]);
  });

  it("recognizes an installed finite bank with an automatic initial load and canonical cashout", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard(
        "short-term-contract-1",
        390,
        "runner",
        "resource",
        {
          title: "Short-Term Contract",
          counters: { bit: 6 },
          counterDisplays: [
            {
              id: "stored_credits",
              amount: 6,
              displayKind: "stored_credits",
              label: "Credits",
              ariaLabel: "6 gespeicherte Credits",
              counterType: "bit",
              usageHint: "spendable",
              creditPool: { kind: "stored_credit" },
            },
          ],
        },
      ),
    ];
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [
        legalAction(
          "short-term-contract-cashout",
          "runner",
          "activated_card_ability",
          "short-term-contract-1",
          "Take 2 hosted credits",
          {
            cardImplementationTakesHostedCredits: true,
            hostedCreditTakeAmount: 2,
            gainCreditsAmount: 2,
          },
        ),
      ],
      deckSnapshot: runnerSnapshot([[390, 3]]),
    });

    expect(profile.runner?.economyBankTools).toEqual([
      expect.objectContaining({
        cardId: 390,
        sourceCardInstanceId: "short-term-contract-1",
        status: "installed",
        currentBankAmount: 6,
        portfolioStoredAmount: 6,
        estimatedPayout: 2,
        buildActionLegal: false,
        cashOutActionLegal: true,
        buildActionIds: [],
        cashOutActionIds: ["short-term-contract-cashout"],
        confidence: "high",
      }),
    ]);
  });

  it("does not infer a Runner credit-bank contract from a deposit phrase", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("capacity-1", syntheticCardDefinitionId("local_capacity_tool"), "runner", "resource", {
        title: "Bank",
        rulesText: "Put [3] credits on this card.",
      }),
      visibleCard(
        "capacity-noise-1",
        syntheticCardDefinitionId("local_capacity_noise"),
        "runner",
        "resource",
        {
          title: "Bank",
          rulesText: "Putty [3] credits on this card.",
        },
      ),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [],
    });

    expect(profile.runner?.economyBankTools).toEqual([]);
  });

  it("requires source evidence before marking search tools legal now", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard(
        "smc-1",
        271,
        "runner",
        "program",
        {
          title: "Self-Modifying Code",
          memoryCost: 2,
        },
      ),
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
      deckSnapshot: runnerSnapshot([[271, 1]]),
    });

    expect(labelOnly.runner?.searchAccess.canSearchProgramsNow).toBe(false);
    expect(labelOnly.runner?.searchAccess.tools[0]).toMatchObject({
      cardId: 271,
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
      deckSnapshot: runnerSnapshot([[271, 1]]),
    });

    expect(sourced.runner?.searchAccess.canSearchProgramsNow).toBe(true);
    expect(sourced.runner?.searchAccess.tools[0]).toMatchObject({
      cardId: 271,
      legalNow: true,
    });
  });

  it("matches search access roles by bounded role terms", () => {
    setTestCardRoles(syntheticCardDefinitionId("local_structured_search"), {
      cardId: syntheticCardDefinitionId("local_structured_search"),
      side: "runner",
      roles: ["setup_program_search"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_noise_tool"), {
      cardId: syntheticCardDefinitionId("local_noise_tool"),
      side: "runner",
      roles: ["program_searchish_noise", "searchlight_noise"],
    });
    try {
      const inputView = playerView("runner");
      inputView.own.gripOrHq = [
        visibleCard(
          "search-1",
          syntheticCardDefinitionId("local_structured_search"),
          "runner",
          "program",
          {
            title: "Structured Search",
          },
        ),
        visibleCard("noise-1", syntheticCardDefinitionId("local_noise_tool"), "runner", "program", {
          title: "Noise Tool",
        }),
      ];

      const profile = buildDeckCapabilityProfile({
        side: "runner",
        playerView: inputView,
        legalActions: [],
      });

      expect(
        profile.runner?.searchAccess.tools.map((tool) => tool.cardId),
      ).toEqual([syntheticCardDefinitionId("local_structured_search")]);
      expect(profile.runner?.searchAccess.tools[0]?.evidence).toContain(
        "capability_source:structured",
      );
    } finally {
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_structured_search"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_noise_tool"));
    }
  });

  it("bounds text-only search access terms to exact tokens", () => {
    const inputView = playerView("runner");
    inputView.own.gripOrHq = [
      visibleCard("text-search-1", syntheticCardDefinitionId("local_text_search"), "runner", "program", {
        title: "Local Text Search",
        rulesText: "Search your stack for a program.",
      }),
      visibleCard(
        "searchlight-1",
        syntheticCardDefinitionId("local_searchlight_noise"),
        "runner",
        "program",
        {
          title: "Searchlight Noise",
          rulesText: "Searchlight your stack for a programmer.",
        },
      ),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [],
    });

    expect(
      profile.runner?.searchAccess.tools.map((tool) => tool.cardId),
    ).toEqual([syntheticCardDefinitionId("local_text_search")]);
    expect(profile.runner?.searchAccess.tools[0]).toMatchObject({
      canSearchPrograms: true,
      canSearchBreakers: true,
      confidence: "high",
    });
  });

  it("uses a reviewed general stack search for breaker access without matching a card title", () => {
    const inputView = playerView("runner");
    inputView.own.gripOrHq = [
      visibleCard(
        "boostergang-1",
        38,
        "runner",
        "event",
        {
          title: "Boostergang Connections",
          rulesText:
            "Trash your hand. Search your stack for as many cards as were successfully trashed in this way and bring them into your hand.",
        },
      ),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [
        legalAction(
          "boostergang-search",
          "runner",
          "play_event",
          "boostergang-1",
          "Play Boostergang Connections",
        ),
      ],
      deckSnapshot: runnerSnapshot([
        [31, 2],
        [36, 2],
        [38, 2],
      ]),
    });

    expect(profile.runner?.searchAccess.tools).toEqual([
      expect.objectContaining({
        cardId: 38,
        canSearchPrograms: true,
        canSearchBreakers: true,
        legalNow: true,
        confidence: "high",
      }),
    ]);
    expect(profile.runner?.breakerCoverageMatrix.wall.searchableNow).toBe(true);
  });

  it("matches breaker capability roles by bounded role prefixes", () => {
    setTestCardRoles(syntheticCardDefinitionId("local_structured_breaker"), {
      cardId: syntheticCardDefinitionId("local_structured_breaker"),
      side: "runner",
      roles: ["breaker_fracter"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_noise_breaker"), {
      cardId: syntheticCardDefinitionId("local_noise_breaker"),
      side: "runner",
      roles: ["breakerish_fracter"],
    });
    try {
      const inputView = playerView("runner");
      inputView.own.gripOrHq = [
        visibleCard(
          "structured-breaker-1",
          syntheticCardDefinitionId("local_structured_breaker"),
          "runner",
          "program",
          {
            title: "Structured Breaker",
          },
        ),
        visibleCard(
          "noise-breaker-1",
          syntheticCardDefinitionId("local_noise_breaker"),
          "runner",
          "program",
          {
            title: "Noise Breaker",
            rulesText: "Break one ice subroutine.",
          },
        ),
      ];

      const profile = buildDeckCapabilityProfile({
        side: "runner",
        playerView: inputView,
        legalActions: [],
      });

      expect(profile.runner?.breakerInventory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            cardId: syntheticCardDefinitionId("local_structured_breaker"),
            confidence: "medium",
            evidence: expect.arrayContaining([
              "capability_source:role_or_subtype",
            ]),
          }),
          expect.objectContaining({
            cardId: syntheticCardDefinitionId("local_noise_breaker"),
            confidence: "low",
            evidence: expect.arrayContaining([
              "capability_source:text_fallback",
              "text_fallback:transition_only",
            ]),
          }),
        ]),
      );
    } finally {
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_structured_breaker"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_noise_breaker"));
    }
  });

  it("bounds text-only breaker coverage terms to exact tokens", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("text-fracter-1", syntheticCardDefinitionId("local_text_fracter"), "runner", "program", {
        title: "Local Text Fracter",
        rulesText: "Break one ice subroutine.",
      }),
      visibleCard(
        "fracteroid-1",
        syntheticCardDefinitionId("local_fracteroid_noise"),
        "runner",
        "program",
        {
          title: "Local Fracteroid",
          rulesText: "Fracteroid barrierish helper.",
        },
      ),
      visibleCard(
        "icebreakerish-1",
        syntheticCardDefinitionId("local_icebreakerish_noise"),
        "runner",
        "program",
        {
          title: "Icebreakerish Tool",
          subtypes: ["icebreakerish"],
        },
      ),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [],
    });

    expect(
      profile.runner?.breakerInventory.map((entry) => entry.cardId),
    ).toEqual([syntheticCardDefinitionId("local_text_fracter")]);
    expect(profile.runner?.breakerInventory[0]?.coverage).toEqual([
      "subtype_limited",
      "wall",
    ]);
  });

  it("does not classify cards that only support icebreakers as breakers", () => {
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      deckSnapshot: runnerSnapshot([
        [35, 3],
        [192, 1],
        [223, 1],
        [283, 2],
      ]),
    });

    expect(
      profile.runner?.breakerInventory.map((entry) => entry.cardId),
    ).toEqual([35]);
    expect(profile.runner?.breakerInventory[0]).toMatchObject({
      coverage: ["subtype_limited", "universal"],
      quantityKnownInDeck: 3,
      confidence: "high",
    });
  });

  it("matches corp plan roles by bounded role terms", () => {
    setTestCardRoles(syntheticCardDefinitionId("local_plan_a"), {
      cardId: syntheticCardDefinitionId("local_plan_a"),
      side: "corp",
      roles: ["remote_score_support"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_plan_b"), {
      cardId: syntheticCardDefinitionId("local_plan_b"),
      side: "corp",
      roles: ["protect_remote"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_plan_c"), {
      cardId: syntheticCardDefinitionId("local_plan_c"),
      side: "corp",
      roles: ["remote_economy_asset"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_plan_d"), {
      cardId: syntheticCardDefinitionId("local_plan_d"),
      side: "corp",
      roles: ["remote_ambush"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_plan_e"), {
      cardId: syntheticCardDefinitionId("local_plan_e"),
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
        server("r1", [
          visibleCard("plan-a", syntheticCardDefinitionId("local_plan_a"), "corp", "operation", {
            title: "Structured Plan A",
          }),
          visibleCard("plan-b", syntheticCardDefinitionId("local_plan_b"), "corp", "upgrade", {
            title: "Structured Plan B",
          }),
          visibleCard("plan-c", syntheticCardDefinitionId("local_plan_c"), "corp", "asset", {
            title: "Structured Plan C",
          }),
          visibleCard("plan-d", syntheticCardDefinitionId("local_plan_d"), "corp", "asset", {
            title: "Structured Plan D",
          }),
          visibleCard("plan-e", syntheticCardDefinitionId("local_plan_e"), "corp", "asset", {
            title: "Role Noise",
          }),
          visibleCard("plan-f", syntheticCardDefinitionId("local_plan_f"), "corp", "asset", {
            title: "Subtype Ambush",
            subtypes: ["Ambush"],
          }),
          visibleCard("plan-g", syntheticCardDefinitionId("local_plan_g"), "corp", "asset", {
            title: "Subtype Noise",
            subtypes: ["ambushish"],
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
        ambushToolsKnown: 2,
      });
    } finally {
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_plan_a"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_plan_b"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_plan_c"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_plan_d"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_plan_e"));
    }
  });

  it("bounds corp profile text signals to exact tokens", () => {
    const inputView = playerView("corp");
    inputView.servers = [
      server("r1", [
        visibleCard(
          "corp-advance",
          syntheticCardDefinitionId("local_alpha_advance"),
          "corp",
          "operation",
          {
            title: "Advance Tool",
          },
        ),
        visibleCard("corp-score", syntheticCardDefinitionId("local_alpha_score"), "corp", "operation", {
          title: "Score Support",
        }),
        visibleCard("corp-rez", syntheticCardDefinitionId("local_alpha_rez"), "corp", "asset", {
          title: "Rez Credits",
        }),
        visibleCard("corp-tax", syntheticCardDefinitionId("local_alpha_tax"), "corp", "ice", {
          title: "Tax ICE",
        }),
        visibleCard("corp-wall", syntheticCardDefinitionId("local_alpha_wall"), "corp", "ice", {
          title: "Barrier",
        }),
        visibleCard("corp-code-gate", syntheticCardDefinitionId("local_alpha_code_gate"), "corp", "ice", {
          rulesText: "Code gate.",
        }),
        visibleCard("corp-sentry", syntheticCardDefinitionId("local_alpha_sentry"), "corp", "ice", {
          subtypes: ["Sentry"],
        }),
        visibleCard("corp-campaign", syntheticCardDefinitionId("local_alpha_campaign"), "corp", "asset", {
          title: "Campaign",
        }),
        visibleCard("corp-noise", syntheticCardDefinitionId("local_alpha_noise"), "corp", "operation", {
          title: "Advanceish Scoreish Rezish Creditsish",
        }),
        visibleCard("corp-tax-noise", syntheticCardDefinitionId("local_alpha_noise_ice"), "corp", "ice", {
          title: "Taxi Traceish Payee Loser",
        }),
        visibleCard(
          "corp-ice-type-noise",
          syntheticCardDefinitionId("local_alpha_ice_type_noise"),
          "corp",
          "ice",
          {
            title: "Barrierish code gateish sentryish",
          },
        ),
        visibleCard(
          "corp-remote-noise",
          syntheticCardDefinitionId("local_alpha_remote_noise"),
          "corp",
          "asset",
          {
            title: "Campaignish Bankish Creditsish",
          },
        ),
      ]),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "corp",
      playerView: inputView,
      legalActions: [],
    });

    expect(profile.corp?.scorePlanProfile).toMatchObject({
      advanceToolsKnown: 1,
      scoreSupportToolsKnown: 1,
    });
    expect(profile.corp?.rezReserveProfile.rezEconomyToolsKnown).toBe(1);
    expect(profile.corp?.iceTaxProfile.taxingIceKnown).toBe(1);
    expect(profile.corp?.iceTaxProfile).toMatchObject({
      barrierIceKnown: 1,
      codeGateIceKnown: 1,
      sentryIceKnown: 1,
    });
    expect(profile.corp?.remotePlanProfile.remoteEconomyToolsKnown).toBe(2);
  });

  it("derives Runner multiaccess pressure from structured access facts", () => {
    setTestCardRoles(syntheticCardDefinitionId("local_runner_attack_a"), {
      cardId: syntheticCardDefinitionId("local_runner_attack_a"),
      side: "runner",
      roles: [],
      effects: [
        {
          kind: "multiaccess",
          timing: "persistent",
          scope: "rnd",
          resource: "cards",
          target: "access.rnd_multiaccess",
          amount: 1,
          repeatable: true,
        },
      ],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_runner_attack_b"), {
      cardId: syntheticCardDefinitionId("local_runner_attack_b"),
      side: "runner",
      roles: ["remote_contest_tool"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_runner_attack_c"), {
      cardId: syntheticCardDefinitionId("local_runner_attack_c"),
      side: "runner",
      roles: ["early_setup"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_runner_attack_noise"), {
      cardId: syntheticCardDefinitionId("local_runner_attack_noise"),
      side: "runner",
      roles: [
        "interface_multiaccess",
        "remote_contestish_noise",
        "setupish_noise",
      ],
    });
    try {
      const inputView = playerView("runner");
      inputView.own.gripOrHq = [
        visibleCard("attack-a", syntheticCardDefinitionId("local_runner_attack_a"), "runner", "event", {
          title: "Attack Plan A",
        }),
        visibleCard("attack-b", syntheticCardDefinitionId("local_runner_attack_b"), "runner", "event", {
          title: "Attack Plan B",
        }),
        visibleCard("attack-c", syntheticCardDefinitionId("local_runner_attack_c"), "runner", "hardware", {
          title: "Attack Plan C",
        }),
        visibleCard(
          "attack-noise",
          syntheticCardDefinitionId("local_runner_attack_noise"),
          "runner",
          "event",
          {
            title: "Attack Noise",
          },
        ),
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
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_runner_attack_a"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_runner_attack_b"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_runner_attack_c"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_runner_attack_noise"));
    }
  });

  it("keeps the non-Broker 9D15 deck search and remote-contest capabilities truthful", () => {
    const deckSnapshot = runnerSnapshot([
      [228,2],
      [233,2],
      [251,2],
      [252,2],
      [278,1],
      [286,1],
      [288,3],
      [291,3],
      [293,2],
      [297,2],
      [306,2],
      [307,3],
      [309,3],
      [313,2],
      [318,1],
      [319,2],
      [320,3],
      [326,1],
      [341,3],
      [351,2],
      [357,1],
    ]);

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      deckSnapshot,
      legalActions: [],
    });

    expect(
      profile.runner?.searchAccess.tools.map((tool) => tool.cardId),
    ).toEqual([326]);
    expect(profile.runner?.attackPlanProfile).toMatchObject({
      remoteContestToolsKnown: 2,
      evidence: expect.arrayContaining(["remote_contest_tools:2"]),
    });
  });

  it("marks missing runner coverage without guessing unavailable deck answers", () => {
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: playerView("runner"),
      legalActions: [
        legalAction("draw", "runner", "draw_card", "basic_action", "Draw"),
      ],
      deckSnapshot: runnerSnapshot([[233, 1]]),
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

  it("removes a breaker from the searchable deck remainder when every copy is known outside", () => {
    const inputView = playerView("runner");
    inputView.own.heapOrArchives = [
      visibleCard(
        "codecracker-1",
        226,
        "runner",
        "program",
      ),
      visibleCard(
        "codecracker-2",
        226,
        "runner",
        "program",
      ),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [],
      deckSnapshot: runnerSnapshot([[226, 2]]),
    });

    expect(profile.runner?.breakerInventory[0]).toMatchObject({
      cardId: 226,
      quantityKnownInDeck: 0,
      locations: ["discarded"],
    });
    expect(profile.runner?.breakerCoverageMatrix.code_gate).toMatchObject({
      inDeckKnown: false,
      inHeapOrArchives: true,
      searchableNow: false,
      drawOnly: false,
      missing: true,
    });
  });

  it("keeps the exact remaining breaker copy searchable across distinct visible zones", () => {
    const inputView = playerView("runner");
    inputView.own.gripOrHq = [
      visibleCard(
        "codecracker-1",
        226,
        "runner",
        "program",
      ),
    ];
    inputView.own.heapOrArchives = [
      visibleCard(
        "codecracker-2",
        226,
        "runner",
        "program",
      ),
    ];

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [],
      deckSnapshot: runnerSnapshot([[226, 3]]),
    });

    expect(profile.runner?.breakerInventory[0]).toMatchObject({
      quantityKnownInDeck: 1,
      locations: ["discarded", "in_deck", "in_hand"],
    });
    expect(profile.runner?.breakerCoverageMatrix.code_gate).toMatchObject({
      inDeckKnown: true,
      inHand: true,
      drawOnly: false,
      missing: false,
    });
  });

  it("counts an instance only once when a side-safe view repeats it", () => {
    const inputView = playerView("runner");
    const breaker = visibleCard(
      "codecracker-1",
      226,
      "runner",
      "program",
    );
    inputView.own.heapOrArchives = [breaker];
    inputView.specialZones = {
      setAside: [breaker],
      removedFromGame: [],
      setAsideCount: 1,
      removedFromGameCount: 0,
    };

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions: [],
      deckSnapshot: runnerSnapshot([[226, 2]]),
    });

    expect(profile.runner?.breakerInventory[0]).toMatchObject({
      quantityKnownInDeck: 1,
      locations: ["discarded", "in_deck", "unavailable"],
    });
  });

  it("redacts deck facts for debug output", () => {
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: playerView("runner"),
      legalActions: [],
      deckSnapshot: runnerSnapshot([
        [226, 1],
        [233, 1],
        [366, 1],
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
      visibleCard(
        "fallback-breaker-1",
        syntheticCardDefinitionId("local_text_only_breaker"),
        "runner",
        "program",
        {
          title: "Local Text Breaker",
          rulesText: "Break one ice subroutine.",
        },
      ),
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
      cardId: syntheticCardDefinitionId("local_text_only_breaker"),
      confidence: "low",
      evidence: expect.arrayContaining([
        "capability_source:text_fallback",
        "text_fallback:transition_only",
      ]),
    });
  });

  it("does not treat Schematics Search Engine title text as a tutor", () => {
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: playerView("runner"),
      legalActions: [],
      deckSnapshot: runnerSnapshot([
        [36, 2],
      ]),
    });

    expect(profile.runner?.searchAccess.tools).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardId: 36,
        }),
      ]),
    );
    expect(profile.runner?.searchAccess.canSearchProgramsNow).toBe(false);
    expect(profile.runner?.searchAccess.canSearchBreakersNow).toBe(false);
  });
});

function runnerSnapshot(
  cards: Array<[cardId: number, quantity: number]>,
): AiDeckStrategyDeckSnapshot {
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
    definitionId: syntheticCardDefinitionId(`${side}-identity`),
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
  definitionId: number,
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
    title: String(definitionId),
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

function setTestCardRoles(
  cardId: number,
  hint: Pick<AiCardHint, "cardId" | "side" | "roles"> & Partial<AiCardHint>,
): void {
  AI_HINTS_BY_CARD.set(cardId, {
    planRoles: [],
    aiSupportStatus: "hinted_only",
    ...hint,
  });
}
