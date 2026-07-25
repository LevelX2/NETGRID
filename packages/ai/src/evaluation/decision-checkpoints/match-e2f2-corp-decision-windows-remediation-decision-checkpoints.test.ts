import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import declineZeroYieldDataWallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e2f2-01-decline-zero-yield-data-wall-rez.json";
import declineNegativeWallStaticJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e2f2-02-decline-negative-wall-static-rez.json";
import keepPositiveMenusRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e2f2-03-keep-positive-menus-rez.json";
import annualReviewsOverSaturatedCreditJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e2f2-04-annual-reviews-over-saturated-credit.json";
import keepPositiveRdWallRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e2f2-05-keep-positive-rd-wall-rez.json";
import rdBeforeEmptyHqProtectionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e2f2-06-rd-before-empty-hq-protection.json";
import overtimeBeforeExtraHqLayerJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e2f2-07-overtime-before-extra-hq-layer.json";
import safeScorelineInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e2f2-08-safe-scoreline-install-has-no-exposure-penalty.json";
import safeScorelineAdvanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e2f2-09-safe-scoreline-advance-has-no-exposure-penalty.json";
import safeScorelineSecondAdvanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e2f2-10-safe-scoreline-second-advance-has-no-exposure-penalty.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match e2f2 Corp decision-window remediation checkpoints", () => {
  it.each([
    ["declines a zero-yield Data Wall rez", declineZeroYieldDataWallJson],
    ["declines a negative Wall of Static rez", declineNegativeWallStaticJson],
    [
      "declines Misleading Access Menus without exact access reduction",
      keepPositiveMenusRezJson,
    ],
    [
      "clears HQ overflow with score-acceleration setup instead of saturated credit or overflowing draw",
      annualReviewsOverSaturatedCreditJson,
    ],
    [
      "declines R&D Wall of Static against a funded visible breaker",
      keepPositiveRdWallRezJson,
    ],
    [
      "purges visible R&D-virus pressure before adding another R&D ICE",
      rdBeforeEmptyHqProtectionJson,
    ],
    [
      "starts the guaranteed Overtime scoreline before an extra HQ layer",
      overtimeBeforeExtraHqLayerJson,
    ],
    [
      "does not mark a safe scoreline install as exposed",
      safeScorelineInstallJson,
    ],
    [
      "does not mark the first safe scoreline advance as exposed",
      safeScorelineAdvanceJson,
    ],
    [
      "does not mark the second safe scoreline advance as exposed",
      safeScorelineSecondAdvanceJson,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
  });

  it("does not route Annual Reviews after R&D has become empty", () => {
    const checkpoint = fixture(annualReviewsOverSaturatedCreditJson);
    checkpoint.source.kind = "synthetic_companion";
    const state = checkpoint.engine.testOnlyGameState;
    const movedCards = [...state.corp.rd];
    state.corp.rd = [];
    state.corp.archives.push(...movedCards);
    for (const cardId of movedCards) {
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "corp", zone: "archives" },
        faceup: true,
        rezzed: false,
      };
    }
    checkpoint.engine.stateHash = hashGameState(state);
    checkpoint.expectation = {
      contractKind: "correctness",
      forbiddenActions: [
        {
          type: "play_operation",
          sourceDefinitionId: "onr_v1_282_annual-reviews",
        },
      ],
    };

    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
