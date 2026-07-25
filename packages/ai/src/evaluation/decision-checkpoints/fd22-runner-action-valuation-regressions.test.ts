import { describe, expect, it } from "vitest";

import redundantPsychicFriendJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd22-01-redundant-psychic-friend-d64.json";
import firstMatadorControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd22-02-first-matador-control-d14.json";
import firstPsychicFriendControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd22-03-first-psychic-friend-control-d53.json";
import zeroClickEndTurnD68Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd22-04-zero-click-end-turn-control-d68.json";
import zeroClickEndTurnD73Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd22-05-zero-click-end-turn-control-d73.json";
import prematureEndTurnD74Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd22-06-premature-end-turn-d74.json";
import prematureEndTurnD75Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd22-07-premature-end-turn-d75.json";
import prematureEndTurnD76Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fd22-08-premature-end-turn-d76.json";
import inevitableCorpDeckoutControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-last-two-05.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match fd22 runner action valuation regression evidence", () => {
  it.each([
    [
      "first in-hand breaker adds missing deck-strategy coverage",
      firstMatadorControlJson,
    ],
    [
      "first Psychic Friend adds code-gate coverage",
      firstPsychicFriendControlJson,
    ],
    ["zero-click end turn remains valid at D68", zeroClickEndTurnD68Json],
    ["zero-click end turn remains valid at D73", zeroClickEndTurnD73Json],
    [
      "four-click end turn remains valid for deterministic Corp deckout",
      inevitableCorpDeckoutControlJson,
    ],
  ])("keeps the positive control: %s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, result.message).toBe(true);
  });

  it("rejects the redundant second Psychic Friend and keeps productive alternatives", () => {
    const result = runAiDecisionCheckpoint(
      fixture(redundantPsychicFriendJson),
    );

    expect(result.ok, result.message).toBe(true);
    expect(result.selectedAction?.type).not.toBe("install_card");
    expect(result.selectedAction?.actionId).not.toContain("psychic-friend");
  });

  it.each([
    ["D74", prematureEndTurnD74Json],
    ["D75", prematureEndTurnD75Json],
    ["D76", prematureEndTurnD76Json],
  ])(
    "rejects premature four-click end turn at %s",
    (_label, json) => {
      const result = runAiDecisionCheckpoint(fixture(json));

      expect(result.ok, result.message).toBe(true);
      expect(result.selectedAction?.type).not.toBe("end_turn");
      expect(result.input.playerView.own.clicks).toBe(4);
    },
  );
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
