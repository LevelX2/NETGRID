import type { AiDecisionInput, Side } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { CARD_ROLES_BY_CARD } from "./ai-hints";
import {
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
} from "./deck-opening-hand";

describe("deck opening hand role classification", () => {
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
