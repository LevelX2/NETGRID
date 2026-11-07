import { describe, expect, it } from "vitest";
import { hashGameState } from "@netgrid/engine";
import { buildDeckCapabilityProfile } from "../../deck-capabilities";

import remoteFundingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-802f-03-remote-fund-before-score-threat-probe-d13.json";
import schematicsJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-802f-01-schematics-no-title-search-d17.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 802F search-role and remote-probe decision checkpoints", () => {
  it("does not classify Schematics Search Engine as a deck-search engine", () => {
    const cp = fixture(schematicsJson);
    // Six credits and the locked four-card damage buffer leave the current
    // reaction reserve unfinished. That safe current action is independent
    // of the search classification being tested.
    cp.expectation = {
      acceptableActions: [{ actionId: "runner.gain_credit" }],
      planExecution: {
        acceptablePlanKinds: ["runner.defense_and_recovery"],
        acceptableCapabilities: ["build_damage_reaction_reserve"],
        requiredAssessmentEvidence: [
          "runner_damage_locked_hand_reaction_reserve",
        ],
      },
    };
    const result = runAiDecisionCheckpoint(cp);
    expect(result.ok, result.message).toBe(true);
    const id = "onr_classic_032_schematics-search-engine";
    expect(cp.deckSnapshot.cards.some((card) => card.cardId === id)).toBe(true);
    const profile = buildDeckCapabilityProfile({
      side: "runner",
      playerView: result.input.playerView,
      legalActions: result.input.legalActions,
      deckSnapshot: cp.deckSnapshot,
    });
    expect(
      profile.runner?.searchAccess.tools.some((tool) => tool.cardId === id),
    ).toBe(false);
  });

  it("retains the exact Matador installation with the reaction reserve funded", () => {
    const cp = fixture(schematicsJson);
    cp.engine.testOnlyGameState.runner.credits = 10;
    cp.engine.stateHash = hashGameState(cp.engine.testOnlyGameState);
    cp.source.kind = "synthetic_companion";
    expectCheckpointToPass(cp);
  });

  it("contests the hidden advanced remote through its P2 threat plan", () => {
    expectCheckpointToPass(fixture(remoteFundingJson));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
