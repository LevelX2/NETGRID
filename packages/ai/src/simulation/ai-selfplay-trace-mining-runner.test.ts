import { describe, expect, it } from "vitest";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { createAiSelfplayTraceMiningRunner } from "./ai-selfplay-trace-mining-runner";
import { detectAiSelfplaySuspiciousDecisions } from "./selfplay-trace-mining";

describe("createAiSelfplayTraceMiningRunner", () => {
  it("keeps action-limit aggregate metrics when long-run findings are dampened", () => {
    const { runAiSelfplayTraceMining } = createAiSelfplayTraceMiningRunner({
      simulateAiGame: (config) =>
        simulationSummary({
          seed: config?.seed ?? "action-limit-seed",
          maxActions: config?.maxActions ?? 480,
        }),
      summarizeMatchProgressionMetrics: (summaries) =>
        ({
          games: summaries.length,
          averageActions: summaries[0]?.actions ?? 0,
          corpScores: 0,
          runnerSteals: 0,
          missedScoreWindows: 0,
        }) as unknown as AiMatchProgressionMetrics,
    });

    const result = runAiSelfplayTraceMining({
      seeds: ["action-limit-seed"],
      maxActions: 480,
    });

    expect(result.config.enabledDetectors).not.toContain(
      "action_limit_reached",
    );
    expect(result.aggregate.findingsByDetector.action_limit_reached ?? 0).toBe(
      0,
    );
    expect(result.aggregate.actionLimitReached).toBe(1);
  });

  it("detects findings from the same redacted trace representation it returns", () => {
    const summary = simulationSummary({
      seed: "stable-findings",
      maxActions: 20,
    });
    summary.actionSequence[0]!.actionAlternatives = [
      {
        rank: 1,
        actionId: "corp_onr_hidden_123",
        actionType: "gain_credit",
        selected: true,
        whyChosen: [],
        whyNot: [],
      },
    ];
    const { runAiSelfplayTraceMining } = createAiSelfplayTraceMiningRunner({
      simulateAiGame: () => summary,
      summarizeMatchProgressionMetrics: () =>
        ({
          games: 1,
          averageActions: 20,
          corpScores: 0,
          runnerSteals: 0,
          missedScoreWindows: 0,
        }) as unknown as AiMatchProgressionMetrics,
    });

    const result = runAiSelfplayTraceMining({
      seeds: ["stable-findings"],
      maxActions: 20,
      detectorIds: ["hidden_info_marker"],
    });
    const repeated = detectAiSelfplaySuspiciousDecisions(result.summaries, {
      detectorIds: ["hidden_info_marker"],
    });

    expect(result.findings).toEqual(repeated);
    expect(result.aggregate.findingsByDetector.hidden_info_marker).toBe(0);
    expect(
      result.summaries[0]?.actionSequence[0]?.actionAlternatives,
    ).toBeUndefined();
  });

  it("still reports forbidden markers in retained trace facts", () => {
    const summary = simulationSummary({ seed: "retained-leak", maxActions: 20 });
    summary.actionSequence[0]!.debugFacts = ["privatePayload:bad"];
    const { runAiSelfplayTraceMining } = createAiSelfplayTraceMiningRunner({
      simulateAiGame: () => summary,
      summarizeMatchProgressionMetrics: () =>
        ({
          games: 1,
          averageActions: 20,
          corpScores: 0,
          runnerSteals: 0,
          missedScoreWindows: 0,
        }) as unknown as AiMatchProgressionMetrics,
    });

    const result = runAiSelfplayTraceMining({
      seeds: ["retained-leak"],
      maxActions: 20,
      detectorIds: ["hidden_info_marker"],
    });
    const repeated = detectAiSelfplaySuspiciousDecisions(result.summaries, {
      detectorIds: ["hidden_info_marker"],
    });

    expect(result.findings).toEqual(repeated);
    expect(result.aggregate.findingsByDetector.hidden_info_marker).toBe(1);
  });
});

function simulationSummary({
  seed,
  maxActions,
}: {
  seed: string;
  maxActions: number;
}): AiSimulationSummary {
  return {
    seed,
    winner: "action_limit_reached",
    actions: maxActions,
    turns: Math.ceil(maxActions / 4),
    finalAgendaPoints: { runner: 0, corp: 0 },
    finalStateHash: `fnv1a:${seed}`,
    eventLogLength: maxActions,
    replayOk: true,
    replayErrors: [],
    actionSequence: [
      {
        side: "corp",
        actionType: "gain_credit",
        selectedActionId: "corp-gain-credit",
        stateVersionBefore: maxActions,
        reasonCode: "corp.synthetic",
        evidence: [],
      } as unknown as AiSimulationSummary["actionSequence"][number],
    ],
    errors: [],
    cardPoolVersion: "0.99.0",
    metrics: {
      illegalActions: 0,
      fallbackRate: 0,
      timeoutRate: 0,
      reasonCodeCoverage: [],
      actionTypeCoverage: [],
      roleCoverage: [],
      progressScore: 0,
      holdout: false,
      doctrine: {},
    } as unknown as AiSimulationSummary["metrics"],
  };
}
