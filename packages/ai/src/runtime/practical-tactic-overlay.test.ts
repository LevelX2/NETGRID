import { describe, expect, it } from "vitest";
import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import { chooseAiAction } from "../index";
import {
  PRACTICAL_TACTIC_BENCHMARK_CASES,
  evaluatePracticalTacticBenchmark,
  frozenLegacyPracticalTacticSelector,
} from "../evaluation/practical-tactic-benchmark";
import { applyPracticalTacticOverlay } from "./practical-tactic-overlay";

describe("PracticalTacticOverlay", () => {
  it("improves the practical tactic corpus over the frozen legacy selector", () => {
    const legacy = evaluatePracticalTacticBenchmark(
      frozenLegacyPracticalTacticSelector,
    );
    const candidate = evaluatePracticalTacticBenchmark((input) =>
      applyPracticalTacticOverlay(input, frozenLegacyDecision(input), {
        practicalTacticOverlay: { enabled: true },
      }),
    );

    expect(legacy.hitRate).toBe(0);
    expect(candidate.caseCount).toBe(32);
    expect(candidate.hitRate).toBe(1);
    expect(candidate.hits - legacy.hits).toBeGreaterThanOrEqual(30);
    expect(candidate.missesByCase).toEqual([]);
  });

  it("is default-off and only applies when explicitly enabled", () => {
    const benchmarkCase = PRACTICAL_TACTIC_BENCHMARK_CASES[0]!;
    const legacy = frozenLegacyDecision(benchmarkCase.input);

    expect(applyPracticalTacticOverlay(benchmarkCase.input, legacy, {})).toBe(
      legacy,
    );
    expect(
      applyPracticalTacticOverlay(benchmarkCase.input, legacy, {
        practicalTacticOverlay: { enabled: true },
      }).actionId,
    ).toBe(benchmarkCase.acceptableActionIds[0]);
  });

  it("is wired into chooseAiAction when enabled", () => {
    const benchmarkCase = PRACTICAL_TACTIC_BENCHMARK_CASES.find(
      (candidate) => candidate.category === "runner_steal_agenda",
    );
    expect(benchmarkCase).toBeDefined();
    if (!benchmarkCase) throw new Error("Missing runner steal benchmark case");

    const decision = chooseAiAction(benchmarkCase.input, {
      practicalTacticOverlay: { enabled: true },
    });

    expect(benchmarkCase.acceptableActionIds).toContain(decision.actionId);
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "practical_tactic:runner_steal_agenda",
        "practical_tactic_overlay_applied:runner.practical_tactic.steal_agenda",
      ]),
    );
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload|secretGripIds|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState/i,
    );
  });
});

function frozenLegacyDecision(input: AiDecisionInput): AiDecision {
  const selected = frozenLegacyPracticalTacticSelector(input).actionId;
  return {
    actionId: selected,
    reasonCode: "frozen_legacy.practical_tactic_reference",
    explanation: "Frozen legacy reference for the practical tactic benchmark.",
    consideredActionIds: input.legalActions.map((action) => action.actionId),
    fallbackUsed: false,
  };
}
