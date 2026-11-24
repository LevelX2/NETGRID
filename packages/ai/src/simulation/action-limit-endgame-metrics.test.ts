import { describe, expect, it } from "vitest";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import { summarizeActionLimitEndgameMetrics } from "./action-limit-endgame-metrics";

describe("action-limit endgame metrics", () => {
  it("counts an event run once even when it leads to multiple access conversions", () => {
    const metrics = summarizeActionLimitEndgameMetrics(
      [
        {
          terminationKind: "action_limit",
          finalAgendaPoints: { runner: 5, corp: 2 },
          actionSequence: [
            {
              ...entry("play_event"),
              runnerRunStarted: true,
              hqRunBoostedBecauseKnownAgenda: true,
            },
            entry("steal_agenda"),
            entry("trash_accessed_card"),
          ],
        },
      ],
      () => true,
    );

    expect(metrics.finalWindowRunnerMeaningfulRunsTaken).toBe(1);
    expect(metrics.endgameScoreOrStealPressureActions).toBe(3);
  });

  it("measures nonstrategic actions within the final strategic window", () => {
    const earlyWindows = Array.from({ length: 35 }, () =>
      entry("continue_run"),
    );
    const finalDecisions = Array.from({ length: 30 }, () =>
      entry("gain_credit"),
    );
    const metrics = summarizeActionLimitEndgameMetrics(
      [
        {
          terminationKind: "action_limit",
          finalAgendaPoints: { runner: 0, corp: 0 },
          actionSequence: [...earlyWindows, ...finalDecisions],
        },
      ],
      () => true,
    );

    expect(metrics.actionLimitLikelyMetricArtifact).toBe(0);
    expect(metrics.actionLimitLikelyDeckPressureIssue).toBe(1);
  });
});

function entry(
  actionType: AiSimulationActionSequenceEntry["actionType"],
): AiSimulationActionSequenceEntry {
  return {
    actionType,
    side: "runner",
    stateVersionBefore: 1,
    reasonCode: "fixture",
    explanation: "fixture",
    confidence: 1,
    evidence: [],
    qualityTags: [],
    fallbackUsed: false,
    timeoutUsed: false,
    stateHashAfter: "fnv1a:fixture",
  };
}
