import { describe, expect, it } from "vitest";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries } from "./selfplay-why-coverage";

describe("selfplay why coverage", () => {
  it("builds why coverage from redacted simulation summaries", () => {
    const report =
      buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries([
        summary([
          action({
            debugFacts: [
              "topLevelWhyNot:alternative:draw_card:semantic_score_below_selected",
              "runtime_why_not:alternative:draw_card:semantic_score_below_selected",
            ],
            actionAlternatives: [
              {
                rank: 1,
                actionId: "gain",
                actionType: "gain_credit",
                selected: true,
                whyChosen: ["semantic_runtime_actual"],
              },
              {
                rank: 2,
                actionId: "draw",
                actionType: "draw_card",
                selected: false,
                whyNot: ["semantic_score_below_selected"],
              },
            ],
          }),
          action(),
        ]),
      ]);

    expect(report).toMatchObject({
      sampleCount: 2,
      decisionsWithTopLevelWhyNot: 1,
      decisionsWithRuntimeWhyNotSection: 1,
      actionAlternativeCount: 2,
      selectedActionAlternativeCount: 1,
      selectedActionAlternativesWithWhyChosen: 1,
      nonSelectedActionAlternativeCount: 1,
      nonSelectedActionAlternativesWithWhyNot: 1,
      actionAlternativesWithWhyChosen: 1,
      actionAlternativesWithWhyNot: 1,
      productiveUseAllowed: false,
      noRuntimeEffect: true,
    });
  });
});

function summary(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiSimulationSummary {
  return {
    seed: "why-coverage",
    winner: "action_limit_reached",
    actions: actionSequence.length,
    turns: 1,
    finalAgendaPoints: { runner: 0, corp: 0 },
    finalStateHash: "fnv1a:why-coverage",
    eventLogLength: actionSequence.length,
    replayOk: true,
    replayErrors: [],
    actionSequence,
    errors: [],
    cardPoolVersion: "0.99.0",
    metrics: {} as AiSimulationSummary["metrics"],
  };
}

function action(
  overrides: Partial<AiSimulationSummary["actionSequence"][number]> = {},
): AiSimulationSummary["actionSequence"][number] {
  return {
    side: "runner",
    stateVersionBefore: 1,
    actionType: "gain_credit",
    reasonCode: "runner.semantic.test",
    explanation: "Synthetic action.",
    confidence: 0.9,
    evidence: [],
    qualityTags: [],
    stateHashAfter: "fnv1a:after",
    fallbackUsed: false,
    timeoutUsed: false,
    ...overrides,
  };
}
