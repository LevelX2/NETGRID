import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { chooseAiAction } from "../index";
import { resetRunnerRunPlanMemory } from "../runtime/runner-run-plan-memory";
import { resetStrategicIntentMemory } from "../strategic-intent-memory";
import { resetTacticalPlanMemory } from "../tactical-plans";
import { buildRealEngineDecisionCorpusScenarios } from "./real-engine-decision-corpus-fixtures";

describe("real Engine inputs through the live Semantic Runtime", () => {
  it("selects the expected action family from every competitive annotated scenario", () => {
    expect(
      evaluateAnnotatedScenarios((input) =>
        chooseWithoutPersistentMemory(input),
      ),
    ).toEqual([]);
  }, 60_000);

  it("would fail for a deterministic chooser that ignores the scenario context", () => {
    const failures = evaluateAnnotatedScenarios(
      (input) => input.legalActions.at(-1)?.actionId ?? "missing-action",
    );

    expect(failures.length).toBeGreaterThan(0);
    expect(failures).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/runner_real_(?:safe_hq_access|safe_rd_access)/),
        expect.stringMatching(/corp_real_score_now_vs_gain_credit/),
      ]),
    );
  });
});

function evaluateAnnotatedScenarios(
  selectActionId: (input: AiDecisionInput) => string,
): string[] {
  const scenarios = buildRealEngineDecisionCorpusScenarios().filter(
    (scenario) => scenario.leagueExpectation,
  );
  const failures: string[] = [];

  expect(scenarios).toHaveLength(20);
  for (const scenario of scenarios) {
    const firstActionId = selectActionId(scenario.input);
    const secondActionId = selectActionId(scenario.input);
    const selected = scenario.input.legalActions.find(
      (action) => action.actionId === firstActionId,
    );

    if (!selected) {
      failures.push(
        `${scenario.scenarioId}: returned non-legal action ${firstActionId}`,
      );
      continue;
    }
    if (secondActionId !== firstActionId) {
      failures.push(
        `${scenario.scenarioId}: non-deterministic ${firstActionId} -> ${secondActionId}`,
      );
    }
    const expectedTypes =
      scenario.leagueExpectation?.expectedTopActionTypes ?? [];
    if (expectedTypes.length > 0 && !expectedTypes.includes(selected.type)) {
      failures.push(
        `${scenario.scenarioId}: expected ${expectedTypes.join("|")}, chose ${selected.type}:${selected.actionId}`,
      );
    }
    const forbiddenTypes =
      scenario.leagueExpectation?.forbiddenTopActionTypes ?? [];
    if (forbiddenTypes.includes(selected.type)) {
      failures.push(
        `${scenario.scenarioId}: forbids ${forbiddenTypes.join("|")}, chose ${selected.type}:${selected.actionId}`,
      );
    }
  }

  return failures;
}

function chooseWithoutPersistentMemory(input: AiDecisionInput): string {
  resetTacticalPlanMemory();
  resetRunnerRunPlanMemory();
  resetStrategicIntentMemory();
  return chooseAiAction(input, { persistTacticalPlanMemory: false }).actionId;
}
