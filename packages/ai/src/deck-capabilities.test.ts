import { describe, expect, it } from "vitest";

import {
  buildDeckCapabilityProfile,
  redactedDeckCapabilityFacts,
} from "./deck-capabilities";
import { AI_HINTS_BY_CARD, type AiCardHint } from "./ai-hints";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import match9d15Checkpoint from "../../../data/scenarios/ai-decision-checkpoints/cp-9d15-01-urgent-remote-inside-job.json";
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
      visibleCard(
        "codecracker-1",
        "onr_v1_014_codecracker",
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
        "onr_v1_059_self-modifying-code",
        "runner",
        "program",
        {
          title: "Self-Modifying Code",
          memoryCost: 2,
        },
      ),
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
        ["onr_v1_014_codecracker", 1],
        ["onr_v1_021_dwarf", 2],
        ["onr_v1_059_self-modifying-code", 1],
        ["onr_v1_154_broker", 1],
      ]),
    });

    expect(
      profile.runner?.breakerInventory.map((entry) => entry.cardId),
    ).toEqual(["onr_v1_014_codecracker", "onr_v1_021_dwarf"]);
    expect(profile.runner?.breakerCoverageMatrix.code_gate.installed).toBe(
      true,
    );
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

  it("bounds memory tool text signals to exact tokens", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("memory-1", "local_memory_tool", "runner", "hardware", {
        title: "Memory Tool",
      }),
      visibleCard(
        "municipal-1",
        "local_municipal_noise",
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

  it("keeps individual bank amounts and payout size distinct in a portfolio", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("broker-1", "onr_v1_154_broker", "runner", "resource", {
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
      visibleCard("broker-2", "onr_v1_154_broker", "runner", "resource", {
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
        },
      ),
    ];
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: inputView,
      legalActions,
      deckSnapshot: runnerSnapshot([["onr_v1_154_broker", 2]]),
    });

    expect(profile.runner?.economyBankTools[0]).toMatchObject({
      currentBankAmount: 12,
      currentBankAmounts: [12, 3],
      portfolioStoredAmount: 15,
      estimatedPayout: 12,
    });
  });

  it("bounds text-only bank tool signals to exact tokens", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard(
        "stored-credits-1",
        "local_stored_credits_tool",
        "runner",
        "resource",
        {
          title: "Stored Credits Tool",
        },
      ),
      visibleCard(
        "stored-noise-1",
        "local_stored_noise_tool",
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

    expect(profile.runner?.economyBankTools.map((tool) => tool.cardId)).toEqual(
      ["local_stored_credits_tool"],
    );
  });

  it("does not mistake a bank deposit amount for a capacity limit", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("capacity-1", "local_capacity_tool", "runner", "resource", {
        title: "Bank",
        rulesText: "Put [3] credits on this card.",
      }),
      visibleCard(
        "capacity-noise-1",
        "local_capacity_noise",
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

    const tools = profile.runner?.economyBankTools ?? [];
    expect(tools.map((tool) => tool.cardId)).toEqual([
      "local_capacity_noise",
      "local_capacity_tool",
    ]);
    expect(tools.every((tool) => !("maxKnownCapacity" in tool))).toBe(true);
  });

  it("requires source evidence before marking search tools legal now", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard(
        "smc-1",
        "onr_v1_059_self-modifying-code",
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
    setTestCardRoles("local_structured_search", {
      cardId: "local_structured_search",
      side: "runner",
      roles: ["setup_program_search"],
    });
    setTestCardRoles("local_noise_tool", {
      cardId: "local_noise_tool",
      side: "runner",
      roles: ["program_searchish_noise", "searchlight_noise"],
    });
    try {
      const inputView = playerView("runner");
      inputView.own.gripOrHq = [
        visibleCard(
          "search-1",
          "local_structured_search",
          "runner",
          "program",
          {
            title: "Structured Search",
          },
        ),
        visibleCard("noise-1", "local_noise_tool", "runner", "program", {
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
      ).toEqual(["local_structured_search"]);
      expect(profile.runner?.searchAccess.tools[0]?.evidence).toContain(
        "capability_source:structured",
      );
    } finally {
      AI_HINTS_BY_CARD.delete("local_structured_search");
      AI_HINTS_BY_CARD.delete("local_noise_tool");
    }
  });

  it("bounds text-only search access terms to exact tokens", () => {
    const inputView = playerView("runner");
    inputView.own.gripOrHq = [
      visibleCard("text-search-1", "local_text_search", "runner", "program", {
        title: "Local Text Search",
        rulesText: "Search your stack for a program.",
      }),
      visibleCard(
        "searchlight-1",
        "local_searchlight_noise",
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
    ).toEqual(["local_text_search"]);
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
        "onr_classic_034_boostergang-connections",
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
        ["onr_classic_027_early-worm", 2],
        ["onr_classic_032_schematics-search-engine", 2],
        ["onr_classic_034_boostergang-connections", 2],
      ]),
    });

    expect(profile.runner?.searchAccess.tools).toEqual([
      expect.objectContaining({
        cardId: "onr_classic_034_boostergang-connections",
        canSearchPrograms: true,
        canSearchBreakers: true,
        legalNow: true,
        confidence: "high",
      }),
    ]);
    expect(profile.runner?.breakerCoverageMatrix.wall.searchableNow).toBe(true);
  });

  it("matches breaker capability roles by bounded role prefixes", () => {
    setTestCardRoles("local_structured_breaker", {
      cardId: "local_structured_breaker",
      side: "runner",
      roles: ["breaker_fracter"],
    });
    setTestCardRoles("local_noise_breaker", {
      cardId: "local_noise_breaker",
      side: "runner",
      roles: ["breakerish_fracter"],
    });
    try {
      const inputView = playerView("runner");
      inputView.own.gripOrHq = [
        visibleCard(
          "structured-breaker-1",
          "local_structured_breaker",
          "runner",
          "program",
          {
            title: "Structured Breaker",
          },
        ),
        visibleCard(
          "noise-breaker-1",
          "local_noise_breaker",
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
            cardId: "local_structured_breaker",
            confidence: "medium",
            evidence: expect.arrayContaining([
              "capability_source:role_or_subtype",
            ]),
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
      AI_HINTS_BY_CARD.delete("local_structured_breaker");
      AI_HINTS_BY_CARD.delete("local_noise_breaker");
    }
  });

  it("bounds text-only breaker coverage terms to exact tokens", () => {
    const inputView = playerView("runner");
    inputView.own.rig = [
      visibleCard("text-fracter-1", "local_text_fracter", "runner", "program", {
        title: "Local Text Fracter",
        rulesText: "Break one ice subroutine.",
      }),
      visibleCard(
        "fracteroid-1",
        "local_fracteroid_noise",
        "runner",
        "program",
        {
          title: "Local Fracteroid",
          rulesText: "Fracteroid barrierish helper.",
        },
      ),
      visibleCard(
        "icebreakerish-1",
        "local_icebreakerish_noise",
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
    ).toEqual(["local_text_fracter"]);
    expect(profile.runner?.breakerInventory[0]?.coverage).toEqual([
      "subtype_limited",
      "wall",
    ]);
  });

  it("does not classify cards that only support icebreakers as breakers", () => {
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      deckSnapshot: runnerSnapshot([
        ["onr_classic_031_rent-i-con", 3],
        ["onr_proteus_134_cortical-cybermodem", 1],
        ["onr_v1_011_cloak", 1],
        ["onr_v1_071_vewy-vewy-quiet", 2],
      ]),
    });

    expect(
      profile.runner?.breakerInventory.map((entry) => entry.cardId),
    ).toEqual(["onr_classic_031_rent-i-con"]);
    expect(profile.runner?.breakerInventory[0]).toMatchObject({
      coverage: ["subtype_limited", "universal"],
      quantityKnownInDeck: 3,
      confidence: "high",
    });
  });

  it("matches corp plan roles by bounded role terms", () => {
    setTestCardRoles("local_plan_a", {
      cardId: "local_plan_a",
      side: "corp",
      roles: ["remote_score_support"],
    });
    setTestCardRoles("local_plan_b", {
      cardId: "local_plan_b",
      side: "corp",
      roles: ["protect_remote"],
    });
    setTestCardRoles("local_plan_c", {
      cardId: "local_plan_c",
      side: "corp",
      roles: ["remote_economy_asset"],
    });
    setTestCardRoles("local_plan_d", {
      cardId: "local_plan_d",
      side: "corp",
      roles: ["remote_ambush"],
    });
    setTestCardRoles("local_plan_e", {
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
          visibleCard("plan-f", "local_plan_f", "corp", "asset", {
            title: "Subtype Ambush",
            subtypes: ["Ambush"],
          }),
          visibleCard("plan-g", "local_plan_g", "corp", "asset", {
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
      AI_HINTS_BY_CARD.delete("local_plan_a");
      AI_HINTS_BY_CARD.delete("local_plan_b");
      AI_HINTS_BY_CARD.delete("local_plan_c");
      AI_HINTS_BY_CARD.delete("local_plan_d");
      AI_HINTS_BY_CARD.delete("local_plan_e");
    }
  });

  it("bounds corp profile text signals to exact tokens", () => {
    const inputView = playerView("corp");
    inputView.servers = [
      server("remote_1", [
        visibleCard(
          "corp-advance",
          "local_alpha_advance",
          "corp",
          "operation",
          {
            title: "Advance Tool",
          },
        ),
        visibleCard("corp-score", "local_alpha_score", "corp", "operation", {
          title: "Score Support",
        }),
        visibleCard("corp-rez", "local_alpha_rez", "corp", "asset", {
          title: "Rez Credits",
        }),
        visibleCard("corp-tax", "local_alpha_tax", "corp", "ice", {
          title: "Tax ICE",
        }),
        visibleCard("corp-wall", "local_alpha_wall", "corp", "ice", {
          title: "Barrier",
        }),
        visibleCard("corp-code-gate", "local_alpha_code_gate", "corp", "ice", {
          rulesText: "Code gate.",
        }),
        visibleCard("corp-sentry", "local_alpha_sentry", "corp", "ice", {
          subtypes: ["Sentry"],
        }),
        visibleCard("corp-campaign", "local_alpha_campaign", "corp", "asset", {
          title: "Campaign",
        }),
        visibleCard("corp-noise", "local_alpha_noise", "corp", "operation", {
          title: "Advanceish Scoreish Rezish Creditsish",
        }),
        visibleCard("corp-tax-noise", "local_alpha_noise_ice", "corp", "ice", {
          title: "Taxi Traceish Payee Loser",
        }),
        visibleCard(
          "corp-ice-type-noise",
          "local_alpha_ice_type_noise",
          "corp",
          "ice",
          {
            title: "Barrierish code gateish sentryish",
          },
        ),
        visibleCard(
          "corp-remote-noise",
          "local_alpha_remote_noise",
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

  it("matches runner attack plan roles by bounded role terms", () => {
    setTestCardRoles("local_runner_attack_a", {
      cardId: "local_runner_attack_a",
      side: "runner",
      roles: ["interface_multiaccess"],
    });
    setTestCardRoles("local_runner_attack_b", {
      cardId: "local_runner_attack_b",
      side: "runner",
      roles: ["remote_contest_tool"],
    });
    setTestCardRoles("local_runner_attack_c", {
      cardId: "local_runner_attack_c",
      side: "runner",
      roles: ["early_setup"],
    });
    setTestCardRoles("local_runner_attack_noise", {
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
        visibleCard(
          "attack-noise",
          "local_runner_attack_noise",
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
      AI_HINTS_BY_CARD.delete("local_runner_attack_a");
      AI_HINTS_BY_CARD.delete("local_runner_attack_b");
      AI_HINTS_BY_CARD.delete("local_runner_attack_c");
      AI_HINTS_BY_CARD.delete("local_runner_attack_noise");
    }
  });

  it("keeps the non-Broker 9D15 deck search and remote-contest capabilities truthful", () => {
    const capturedSnapshot =
      match9d15Checkpoint.deckSnapshot as AiDeckStrategyDeckSnapshot;
    const deckSnapshot = {
      ...capturedSnapshot,
      cards: capturedSnapshot.cards.filter(
        (card) => card.cardId !== "onr_v1_154_broker",
      ),
    };

    const profile = buildDeckCapabilityProfile({
      side: "runner",
      deckSnapshot,
      legalActions: [],
    });

    expect(
      profile.runner?.searchAccess.tools.map((tool) => tool.cardId),
    ).toEqual(["onr_v1_114_temple-microcode-outlet"]);
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
      visibleCard(
        "fallback-breaker-1",
        "local_text_only_breaker",
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
      cardId: "local_text_only_breaker",
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
        ["onr_classic_032_schematics-search-engine", 2],
      ]),
    });

    expect(profile.runner?.searchAccess.tools).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardId: "onr_classic_032_schematics-search-engine",
        }),
      ]),
    );
    expect(profile.runner?.searchAccess.canSearchProgramsNow).toBe(false);
    expect(profile.runner?.searchAccess.canSearchBreakersNow).toBe(false);
  });
});

function runnerSnapshot(
  cards: Array<[cardId: string, quantity: number]>,
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

function setTestCardRoles(
  cardId: string,
  hint: Pick<AiCardHint, "cardId" | "side" | "roles"> & Partial<AiCardHint>,
): void {
  AI_HINTS_BY_CARD.set(cardId, {
    planRoles: [],
    aiSupportStatus: "hinted_only",
    ...hint,
  });
}
