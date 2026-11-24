import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import type { AiDecisionInput, Side } from "@netgrid/shared";
import { describe, expect, it, vi } from "vitest";

import { AI_HINTS_BY_CARD as mockedHints, type AiCardHint } from "./ai-hints";
import {
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
} from "./deck-opening-hand";

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
const corpOpeningIncome = {
  kind: "action_economy",
  timing: "action",
  scope: "corp",
  resource: "credits",
  amount: 2,
} as const;

describe("deck opening hand role classification", () => {
  it("mulligans the historical Manhunt hand when its strategy pieces are not opening-executable", () => {
    const historical = corpOpeningInput(
      [
        497,
        525,
        495,
        514,
        516,
      ],
      ["corp.fast_advance", "corp.tag_trace_punish", "corp.damage_kill"],
    );

    const evaluation = evaluateCorpOpeningHand(historical);

    expect(evaluation.decision).toBe("mulligan");
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "opening_agendas:0",
        "opening_ice:0",
        "opening_economy:0",
        "opening_executable_strategy_lines:none",
        "opening_viability_cap:42",
      ]),
    );
    expect(evaluation.reasons).toContain("no_executable_opening_line");
  });

  it("mulligans the live zero-ICE punish hand even when it contains a remote tag enabler", () => {
    const evaluation = evaluateCorpOpeningHand(
      corpOpeningInput(
        [
          499,
          513,
          514,
          514,
          545,
        ],
        ["corp.tag_trace_punish", "corp.damage_kill"],
      ),
    );

    expect(evaluation).toMatchObject({
      decision: "mulligan",
      reasons: expect.arrayContaining(["no_executable_opening_line"]),
      evidence: expect.arrayContaining([
        "opening_ice:0",
        "opening_executable_strategy_lines:none",
        "opening_viability_cap:42",
      ]),
    });
  });

  it("keeps a legitimate no-ICE fast-advance opening with target, tool and liquidity", () => {
    const evaluation = evaluateCorpOpeningHand(
      corpOpeningInput(
        [
          408,
          516,
          521,
          497,
          514,
        ],
        ["corp.fast_advance"],
      ),
    );

    expect(evaluation.decision).toBe("keep");
    expect(evaluation.evidence).toContain(
      "opening_executable_strategy_lines:corp.fast_advance",
    );
    expect(evaluation.evidence).not.toContain("opening_viability_cap:42");
  });

  it("keeps a protected tag-punish opening whose source and payoffs can work together", () => {
    const evaluation = evaluateCorpOpeningHand(
      corpOpeningInput(
        [
          435,
          525,
          497,
          514,
          516,
        ],
        ["corp.tag_trace_punish", "corp.damage_kill"],
      ),
    );

    expect(evaluation.decision).toBe("keep");
    expect(evaluation.evidence).toContain(
      "opening_executable_strategy_lines:corp.damage_kill,corp.tag_trace_punish",
    );
  });

  it("counts each opening card once per role family", () => {
    setTestCardRoles(syntheticCardDefinitionId("local_multi_agenda"), {
      cardId: syntheticCardDefinitionId("local_multi_agenda"),
      side: "corp",
      roles: ["agenda", "corp_score_agenda", "agenda_rush"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_multi_ice"), {
      cardId: syntheticCardDefinitionId("local_multi_ice"),
      side: "corp",
      roles: ["corp_install_ice", "barrier_ice", "etr_ice", "taxing_ice"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_multi_economy"), {
      cardId: syntheticCardDefinitionId("local_multi_economy"),
      side: "corp",
      roles: ["economy_asset", "economy_operation", "draw_operation"],
      effects: [corpOpeningIncome],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_multi_breaker"), {
      cardId: syntheticCardDefinitionId("local_multi_breaker"),
      side: "runner",
      roles: ["breaker_fracter", "breaker_decoder", "runner_program"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_runner_economy"), {
      cardId: syntheticCardDefinitionId("local_runner_economy"),
      side: "runner",
      roles: ["draw_event"],
    });
    try {
      const corp = evaluateCorpOpeningHand(
        input("corp", [
          syntheticCardDefinitionId("local_multi_agenda"),
          syntheticCardDefinitionId("local_multi_ice"),
          syntheticCardDefinitionId("local_multi_economy"),
        ]),
      );
      const runner = evaluateRunnerOpeningHand(
        input("runner", [syntheticCardDefinitionId("local_multi_breaker"), syntheticCardDefinitionId("local_runner_economy")]),
      );

      expect(corp.evidence).toContain("opening_agendas:1");
      expect(corp.evidence).toContain("opening_ice:1");
      expect(corp.evidence).toContain("opening_economy:1");
      expect(runner.evidence).toContain("opening_breakers:1");
      expect(runner.evidence).toContain("opening_setup:1");
    } finally {
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_multi_agenda"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_multi_ice"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_multi_economy"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_multi_breaker"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_runner_economy"));
    }
  });

  it("requires a Corp credit effect and matches Runner economy roles by bounded terms", () => {
    setTestCardRoles(syntheticCardDefinitionId("local_opening_economy"), {
      cardId: syntheticCardDefinitionId("local_opening_economy"),
      side: "corp",
      roles: ["economy_asset"],
      effects: [corpOpeningIncome],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_opening_noise"), {
      cardId: syntheticCardDefinitionId("local_opening_noise"),
      side: "corp",
      roles: ["uneconomy_noise", "drawish_noise"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_runner_economy"), {
      cardId: syntheticCardDefinitionId("local_runner_economy"),
      side: "runner",
      roles: ["draw_event"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_runner_noise"), {
      cardId: syntheticCardDefinitionId("local_runner_noise"),
      side: "runner",
      roles: ["economyish_noise", "withdraw_noise"],
    });
    try {
      expect(
        evaluateCorpOpeningHand(
          input("corp", [syntheticCardDefinitionId("local_opening_economy"), syntheticCardDefinitionId("local_opening_noise")]),
        ).evidence,
      ).toContain("opening_economy:1");
      expect(
        evaluateRunnerOpeningHand(
          input("runner", [syntheticCardDefinitionId("local_runner_economy"), syntheticCardDefinitionId("local_runner_noise")]),
        ).evidence,
      ).toContain("opening_economy:1");
    } finally {
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_opening_economy"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_opening_noise"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_runner_economy"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_runner_noise"));
    }
  });

  it("counts Corp remote-root opening support by bounded role terms", () => {
    setTestCardRoles(syntheticCardDefinitionId("local_remote_support"), {
      cardId: syntheticCardDefinitionId("local_remote_support"),
      side: "corp",
      roles: ["remote_support"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_remote_support_noise"), {
      cardId: syntheticCardDefinitionId("local_remote_support_noise"),
      side: "corp",
      roles: ["remote_supportish_noise", "classet_noise", "upgradeish_noise"],
    });
    try {
      const protectedRemoteSupport = evaluateCorpOpeningHand(
        input("corp", [syntheticCardDefinitionId("local_remote_support")], {
          ownDeckCapabilities: {
            corp: { remotePlanProfile: { remoteProtectionToolsKnown: 1 } },
          },
        }),
      );
      const noiseOnly = evaluateCorpOpeningHand(
        input("corp", [syntheticCardDefinitionId("local_remote_support_noise")], {
          ownDeckCapabilities: {
            corp: { remotePlanProfile: { remoteProtectionToolsKnown: 1 } },
          },
        }),
      );

      expect(protectedRemoteSupport.score).toBe(noiseOnly.score + 10);
    } finally {
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_remote_support"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_remote_support_noise"));
    }
  });

  it("caps a three-card explicit run-pressure opening without breaker access", () => {
    setTestCardRoles(syntheticCardDefinitionId("local_true_run_pressure"), {
      cardId: syntheticCardDefinitionId("local_true_run_pressure"),
      side: "runner",
      roles: ["run_pressure"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_pressure_economy"), {
      cardId: syntheticCardDefinitionId("local_pressure_economy"),
      side: "runner",
      roles: ["economy_event"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_pressure_setup"), {
      cardId: syntheticCardDefinitionId("local_pressure_setup"),
      side: "runner",
      roles: ["runner_program"],
    });
    try {
      const evaluation = evaluateRunnerOpeningHand(
        input("runner", [
          syntheticCardDefinitionId("local_true_run_pressure"),
          syntheticCardDefinitionId("local_true_run_pressure"),
          syntheticCardDefinitionId("local_true_run_pressure"),
          syntheticCardDefinitionId("local_pressure_economy"),
          syntheticCardDefinitionId("local_pressure_setup"),
        ]),
      );

      expect(evaluation).toMatchObject({
        decision: "mulligan",
        score: 44,
        evidence: expect.arrayContaining([
          "opening_breaker_access:0",
          "opening_pressure:3",
        ]),
      });
    } finally {
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_true_run_pressure"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_pressure_economy"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_pressure_setup"));
    }
  });

  it("keeps an in-hand breaker recognized by the canonical deck capability profile", () => {
    setTestCardRoles(syntheticCardDefinitionId("local_capability_breaker"), {
      cardId: syntheticCardDefinitionId("local_capability_breaker"),
      side: "runner",
      roles: ["runner_program"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_capability_pressure"), {
      cardId: syntheticCardDefinitionId("local_capability_pressure"),
      side: "runner",
      roles: ["run_pressure"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_capability_economy"), {
      cardId: syntheticCardDefinitionId("local_capability_economy"),
      side: "runner",
      roles: ["economy_event"],
    });
    try {
      const evaluation = evaluateRunnerOpeningHand(
        input(
          "runner",
          [
            syntheticCardDefinitionId("local_capability_breaker"),
            syntheticCardDefinitionId("local_capability_pressure"),
            syntheticCardDefinitionId("local_capability_pressure"),
            syntheticCardDefinitionId("local_capability_pressure"),
            syntheticCardDefinitionId("local_capability_economy"),
          ],
          {
            difficulty: "hard",
            ownDeckStrategyProfile: {
              primaryStrategies: ["runner.rig_first"],
              secondaryStrategies: [],
              warnings: [],
            },
            ownDeckCapabilities: {
              confidence: "high",
              runner: {
                breakerInventory: [
                  {
                    cardId: syntheticCardDefinitionId("local_capability_breaker"),
                    coverage: ["wall", "code_gate", "sentry"],
                    locations: ["in_hand", "in_deck"],
                    confidence: "high",
                  },
                ],
              },
            },
          },
        ),
      );

      expect(evaluation).toMatchObject({
        decision: "keep",
        evidence: expect.arrayContaining([
          "opening_breakers:1",
          "opening_capability_breakers:1",
          "opening_breaker_access:1",
        ]),
      });
    } finally {
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_capability_breaker"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_capability_pressure"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_capability_economy"));
    }
  });

  it("does not treat low-confidence or non-hand capability inventory as opening access", () => {
    setTestCardRoles(syntheticCardDefinitionId("local_uncertain_breaker"), {
      cardId: syntheticCardDefinitionId("local_uncertain_breaker"),
      side: "runner",
      roles: ["runner_program"],
    });
    setTestCardRoles(syntheticCardDefinitionId("local_uncertain_pressure"), {
      cardId: syntheticCardDefinitionId("local_uncertain_pressure"),
      side: "runner",
      roles: ["run_pressure"],
    });
    try {
      for (const capability of [
        { locations: ["in_hand"], confidence: "low" },
        { locations: ["in_deck"], confidence: "high" },
      ]) {
        const evaluation = evaluateRunnerOpeningHand(
          input(
            "runner",
            [
              syntheticCardDefinitionId("local_uncertain_breaker"),
              syntheticCardDefinitionId("local_uncertain_pressure"),
              syntheticCardDefinitionId("local_uncertain_pressure"),
              syntheticCardDefinitionId("local_uncertain_pressure"),
              syntheticCardDefinitionId("local_uncertain_pressure"),
            ],
            {
              difficulty: "hard",
              ownDeckCapabilities: {
                confidence: "high",
                runner: {
                  breakerInventory: [
                    {
                      cardId: syntheticCardDefinitionId("local_uncertain_breaker"),
                      coverage: ["universal"],
                      ...capability,
                    },
                  ],
                },
              },
            },
          ),
        );

        expect(evaluation).toMatchObject({
          decision: "mulligan",
          evidence: expect.arrayContaining([
            "opening_breakers:0",
            "opening_capability_breakers:0",
          ]),
        });
      }
    } finally {
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_uncertain_breaker"));
      AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_uncertain_pressure"));
    }
  });

  it("counts an affordable in-hand search tool as opening breaker access when standard coverage is in the deck", () => {
    registerRunnerSearchOpeningRoles();
    try {
      const searchOpening = runnerSearchOpeningInput();

      const evaluation = evaluateRunnerOpeningHand(searchOpening);

      expect(evaluation.decision).toBe("keep");
      expect(evaluation.evidence).toEqual(
        expect.arrayContaining([
          "opening_breakers:0",
          "opening_breaker_search_tools:1",
          "opening_breaker_access:1",
        ]),
      );
    } finally {
      unregisterRunnerSearchOpeningRoles();
    }
  });

  it.each([
    ["the tool is only in the deck", { searchStatus: "in_deck" }],
    ["the in-hand tool is unaffordable", { searchCost: 6 }],
    ["the deck has no standard breaker coverage", { coverage: ["special"] }],
  ])("does not invent opening breaker access when %s", (_label, options) => {
    registerRunnerSearchOpeningRoles();
    try {
      const evaluation = evaluateRunnerOpeningHand(
        runnerSearchOpeningInput(options),
      );

      expect(evaluation.decision).toBe("mulligan");
      expect(evaluation.evidence).toEqual(
        expect.arrayContaining([
          "opening_breakers:0",
          "opening_breaker_search_tools:0",
          "opening_breaker_access:0",
        ]),
      );
    } finally {
      unregisterRunnerSearchOpeningRoles();
    }
  });
});

function registerRunnerSearchOpeningRoles(): void {
  setTestCardRoles(syntheticCardDefinitionId("local_opening_search"), {
    cardId: syntheticCardDefinitionId("local_opening_search"),
    side: "runner",
    roles: ["program_search", "run_pressure"],
  });
  setTestCardRoles(syntheticCardDefinitionId("local_opening_economy"), {
    cardId: syntheticCardDefinitionId("local_opening_economy"),
    side: "runner",
    roles: ["economy_event", "run_pressure"],
  });
  setTestCardRoles(syntheticCardDefinitionId("local_opening_setup"), {
    cardId: syntheticCardDefinitionId("local_opening_setup"),
    side: "runner",
    roles: ["runner_program"],
  });
}

function unregisterRunnerSearchOpeningRoles(): void {
  AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_opening_search"));
  AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_opening_economy"));
  AI_HINTS_BY_CARD.delete(syntheticCardDefinitionId("local_opening_setup"));
}

function runnerSearchOpeningInput(
  options: {
    searchStatus?: string;
    searchCost?: number;
    coverage?: string[];
  } = {},
): AiDecisionInput {
  const result = input(
    "runner",
    [
      syntheticCardDefinitionId("local_opening_search"),
      syntheticCardDefinitionId("local_opening_economy"),
      syntheticCardDefinitionId("local_opening_economy"),
      syntheticCardDefinitionId("local_opening_economy"),
      syntheticCardDefinitionId("local_opening_setup"),
    ],
    {
      difficulty: "hard",
      ownDeckStrategyProfile: {
        primaryStrategies: ["runner.search.breaker"],
        secondaryStrategies: [],
        warnings: [],
      },
      ownDeckCapabilities: {
        confidence: "high",
        runner: {
          economyBankTools: [{}],
          searchAccess: {
            tools: [
              {
                cardId: syntheticCardDefinitionId("local_opening_search"),
                status: options.searchStatus ?? "in_hand",
                canSearchBreakers: true,
                confidence: "high",
              },
            ],
          },
          breakerInventory: [
            {
              coverage: options.coverage ?? ["wall", "code_gate", "sentry"],
              locations: ["in_deck"],
              confidence: "high",
            },
          ],
        },
      },
    },
  );
  result.playerView.own.credits = 5;
  const searchCard = result.playerView.own.gripOrHq[0];
  if (!searchCard) throw new Error("Expected local opening search card");
  searchCard.type = "event";
  searchCard.cost = options.searchCost ?? 1;
  return result;
}

function input(
  side: Side,
  definitionIds: number[],
  extra: Record<string, unknown> = {},
): AiDecisionInput {
  return {
    difficulty: "normal",
    playerView: {
      side,
      own: {
        credits: 0,
        gripOrHq: definitionIds.map((definitionId) => ({
          definitionId,
          instanceId: `${definitionId}-1`,
          title: String(definitionId),
          owner: side,
          controller: side,
          known: true,
        })),
      },
    },
    ...extra,
  } as unknown as AiDecisionInput;
}

function corpOpeningInput(
  definitionIds: number[],
  primaryStrategies: string[],
): AiDecisionInput {
  const result = input("corp", definitionIds, {
    difficulty: "hard",
    ownDeckStrategyProfile: {
      primaryStrategies,
      secondaryStrategies: [],
      warnings: [],
    },
    ownDeckCapabilities: {
      confidence: "high",
      corp: { remotePlanProfile: { remoteProtectionToolsKnown: 8 } },
    },
  });
  result.playerView.own.credits = 5;
  return result;
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
