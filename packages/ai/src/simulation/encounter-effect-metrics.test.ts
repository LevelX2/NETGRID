import { expect, it } from "vitest";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { summarizeEncounterEffectMetrics } from "./encounter-effect-metrics";

it("counts active encounter evidence on Runner actions", () => {
  const entry: AiSimulationActionSequenceEntry = {
    side: "runner",
    stateVersionBefore: 1,
    actionType: "break_subroutine",
    reasonCode: "test",
    explanation: "test",
    confidence: 1,
    evidence: [
      "run_remainder_subroutine_effect:true",
      "unbroken_run_effect_applied_to_remaining_path:true",
    ],
    qualityTags: [],
    stateHashAfter: "sha256:test",
    fallbackUsed: false,
    timeoutUsed: false,
  };
  const summary = {
    actionSequence: [entry, { ...entry, side: "corp" }],
  } as AiSimulationSummary;
  expect(summarizeEncounterEffectMetrics([summary])).toMatchObject({
    futureEffectSubroutinesEncountered: 1,
    futureEffectSubroutinesWithRemainingIce: 1,
    futureEffectBreaksTaken: 1,
    futureEffectSubroutinesWithoutRemainingIce: 0,
  });
});
