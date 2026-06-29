import { describe, expect, it } from "vitest";
import type { AiSimulationSummary } from "./ai-simulation-summary";

import { summarizeMatchProgressionMetrics } from "./match-progression-summary";

describe("summarizeMatchProgressionMetrics", () => {
  it("counts successful run action types exactly", () => {
    const metrics = summarizeMatchProgressionMetrics([
      summary([
        action("start_run", "hq"),
        action("access_card"),
        action("access_card_noise"),
      ]),
    ]);

    expect(metrics.successfulCentralRuns).toBe(1);
  });
});

function summary(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiSimulationSummary {
  return {
    seed: "test-seed",
    winner: "runner",
    actions: actionSequence.length,
    turns: 1,
    finalAgendaPoints: { runner: 0, corp: 0 },
    finalStateHash: "hash",
    eventLogLength: 0,
    replayOk: true,
    replayErrors: [],
    actionSequence,
    errors: [],
    cardPoolVersion: "test",
    metrics: {},
  } as unknown as AiSimulationSummary;
}

function action(
  actionType: string,
  targetServerId?: string,
): AiSimulationSummary["actionSequence"][number] {
  return {
    side: "runner",
    actionType,
    turnNumber: 1,
    evidence: [],
    ...(targetServerId ? { targetServerId } : {}),
  } as unknown as AiSimulationSummary["actionSequence"][number];
}
