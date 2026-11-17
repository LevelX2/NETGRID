import { expect, it } from "vitest";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import { tagSourceConvertsToRunnerTagged } from "./tag-punish-funnel-predicates";

function entry(
  facts: Partial<AiSimulationActionSequenceEntry> = {},
): AiSimulationActionSequenceEntry {
  return {
    side: "corp",
    actionType: "play_operation",
    reasonCode: "test",
    stateVersionBefore: 1,
    explanation: "test",
    confidence: 1,
    evidence: [],
    qualityTags: [],
    stateHashAfter: "hash",
    fallbackUsed: false,
    timeoutUsed: false,
    ...facts,
  };
}

it("attributes a tag applied by the source action itself", () => {
  expect(
    tagSourceConvertsToRunnerTagged(
      [
        entry({
          corpTagSourceTaken: true,
          runnerTagsBeforeAction: 0,
          runnerTagsAfterAction: 1,
        }),
      ],
      0,
    ),
  ).toBe(true);
});

it("does not attribute a tag from a subsequent distinct source", () => {
  expect(
    tagSourceConvertsToRunnerTagged(
      [
        entry({
          corpTagSourceTaken: true,
          runnerTagsBeforeAction: 0,
          runnerTagsAfterAction: 0,
        }),
        entry({ corpTagSourceTaken: true, runnerTagAddedByAction: true }),
      ],
      0,
    ),
  ).toBe(false);
});
