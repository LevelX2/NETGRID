import type { AiDecisionInput, Side } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { CARD_ROLES_BY_CARD } from "./ai-hints";
import {
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
} from "./deck-opening-hand";

describe("deck opening hand role classification", () => {
  it("mulligans the historical Manhunt hand when its strategy pieces are not opening-executable", () => {
    const historical = corpOpeningInput(
      [
        "onr_v1_285_closed-accounts",
        "onr_v1_313_city-surveillance",
        "onr_v1_283_audit-of-call-records",
        "onr_v1_302_scorched-earth",
        "onr_v1_304_systematic-layoffs",
      ],
      [
        "corp.fast_advance",
        "corp.tag_trace_punish",
        "corp.damage_kill",
      ],
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

  it("keeps a legitimate no-ICE fast-advance opening with target, tool and liquidity", () => {
    const evaluation = evaluateCorpOpeningHand(
      corpOpeningInput(
        [
          "onr_v1_196_corporate-war",
          "onr_v1_304_systematic-layoffs",
          "onr_v1_309_bbs-whispering-campaign",
          "onr_v1_285_closed-accounts",
          "onr_v1_302_scorched-earth",
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
          "onr_v1_223_banpei",
          "onr_v1_313_city-surveillance",
          "onr_v1_285_closed-accounts",
          "onr_v1_302_scorched-earth",
          "onr_v1_304_systematic-layoffs",
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
    CARD_ROLES_BY_CARD.set("local_multi_agenda", {
      cardId: "local_multi_agenda",
      side: "corp",
      roles: ["agenda", "corp_score_agenda", "agenda_rush"],
    });
    CARD_ROLES_BY_CARD.set("local_multi_ice", {
      cardId: "local_multi_ice",
      side: "corp",
      roles: ["corp_install_ice", "barrier_ice", "etr_ice", "taxing_ice"],
    });
    CARD_ROLES_BY_CARD.set("local_multi_economy", {
      cardId: "local_multi_economy",
      side: "corp",
      roles: ["economy_asset", "economy_operation", "draw_operation"],
    });
    CARD_ROLES_BY_CARD.set("local_multi_breaker", {
      cardId: "local_multi_breaker",
      side: "runner",
      roles: ["breaker_fracter", "breaker_decoder", "runner_program"],
    });
    CARD_ROLES_BY_CARD.set("local_runner_economy", {
      cardId: "local_runner_economy",
      side: "runner",
      roles: ["draw_event"],
    });
    try {
      const corp = evaluateCorpOpeningHand(
        input("corp", [
          "local_multi_agenda",
          "local_multi_ice",
          "local_multi_economy",
        ]),
      );
      const runner = evaluateRunnerOpeningHand(
        input("runner", ["local_multi_breaker", "local_runner_economy"]),
      );

      expect(corp.evidence).toContain("opening_agendas:1");
      expect(corp.evidence).toContain("opening_ice:1");
      expect(corp.evidence).toContain("opening_economy:1");
      expect(runner.evidence).toContain("opening_breakers:1");
      expect(runner.evidence).toContain("opening_setup:1");
    } finally {
      CARD_ROLES_BY_CARD.delete("local_multi_agenda");
      CARD_ROLES_BY_CARD.delete("local_multi_ice");
      CARD_ROLES_BY_CARD.delete("local_multi_economy");
      CARD_ROLES_BY_CARD.delete("local_multi_breaker");
      CARD_ROLES_BY_CARD.delete("local_runner_economy");
    }
  });

  it("counts opening economy roles by bounded role terms", () => {
    CARD_ROLES_BY_CARD.set("local_opening_economy", {
      cardId: "local_opening_economy",
      side: "corp",
      roles: ["economy_asset"],
    });
    CARD_ROLES_BY_CARD.set("local_opening_noise", {
      cardId: "local_opening_noise",
      side: "corp",
      roles: ["uneconomy_noise", "drawish_noise"],
    });
    CARD_ROLES_BY_CARD.set("local_runner_economy", {
      cardId: "local_runner_economy",
      side: "runner",
      roles: ["draw_event"],
    });
    CARD_ROLES_BY_CARD.set("local_runner_noise", {
      cardId: "local_runner_noise",
      side: "runner",
      roles: ["economyish_noise", "withdraw_noise"],
    });
    try {
      expect(
        evaluateCorpOpeningHand(
          input("corp", ["local_opening_economy", "local_opening_noise"]),
        ).evidence,
      ).toContain("opening_economy:1");
      expect(
        evaluateRunnerOpeningHand(
          input("runner", ["local_runner_economy", "local_runner_noise"]),
        ).evidence,
      ).toContain("opening_economy:1");
    } finally {
      CARD_ROLES_BY_CARD.delete("local_opening_economy");
      CARD_ROLES_BY_CARD.delete("local_opening_noise");
      CARD_ROLES_BY_CARD.delete("local_runner_economy");
      CARD_ROLES_BY_CARD.delete("local_runner_noise");
    }
  });

  it("counts Corp remote-root opening support by bounded role terms", () => {
    CARD_ROLES_BY_CARD.set("local_remote_support", {
      cardId: "local_remote_support",
      side: "corp",
      roles: ["remote_support"],
    });
    CARD_ROLES_BY_CARD.set("local_remote_support_noise", {
      cardId: "local_remote_support_noise",
      side: "corp",
      roles: ["remote_supportish_noise", "classet_noise", "upgradeish_noise"],
    });
    try {
      const protectedRemoteSupport = evaluateCorpOpeningHand(
        input("corp", ["local_remote_support"], {
          ownDeckCapabilities: {
            corp: { remotePlanProfile: { remoteProtectionToolsKnown: 1 } },
          },
        }),
      );
      const noiseOnly = evaluateCorpOpeningHand(
        input("corp", ["local_remote_support_noise"], {
          ownDeckCapabilities: {
            corp: { remotePlanProfile: { remoteProtectionToolsKnown: 1 } },
          },
        }),
      );

      expect(protectedRemoteSupport.score).toBe(noiseOnly.score + 10);
    } finally {
      CARD_ROLES_BY_CARD.delete("local_remote_support");
      CARD_ROLES_BY_CARD.delete("local_remote_support_noise");
    }
  });
});

function input(
  side: Side,
  definitionIds: string[],
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
          title: definitionId,
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
  definitionIds: string[],
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
