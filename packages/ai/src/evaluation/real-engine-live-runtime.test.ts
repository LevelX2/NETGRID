import { describe, expect, it } from "vitest";

import { chooseAiAction } from "../index";
import { resetRunnerRunPlanMemory } from "../runtime/runner-run-plan-memory";
import { resetStrategicIntentMemory } from "../strategic-intent-memory";
import { resetTacticalPlanMemory } from "../tactical-plans";
import { buildRealEngineDecisionCorpusScenarios } from "./real-engine-decision-corpus-fixtures";

describe("real Engine inputs through the live Semantic Runtime", () => {
  it("selects the expected action family from every competitive annotated scenario", () => {
    const scenarios = buildRealEngineDecisionCorpusScenarios().filter(
      (scenario) => scenario.leagueExpectation,
    );
    const failures: string[] = [];

    expect(scenarios).toHaveLength(20);
    for (const scenario of scenarios) {
      const first = chooseWithoutPersistentMemory(scenario.input);
      const second = chooseWithoutPersistentMemory(scenario.input);
      const selected = scenario.input.legalActions.find(
        (action) => action.actionId === first.actionId,
      );

      if (!selected) {
        failures.push(
          `${scenario.scenarioId}: returned non-legal action ${first.actionId}`,
        );
        continue;
      }
      if (second.actionId !== first.actionId) {
        failures.push(
          `${scenario.scenarioId}: non-deterministic ${first.actionId} -> ${second.actionId}`,
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

    expect(failures).toEqual([]);
  }, 60_000);
});

function chooseWithoutPersistentMemory(
  input: ReturnType<
    typeof buildRealEngineDecisionCorpusScenarios
  >[number]["input"],
) {
  resetTacticalPlanMemory();
  resetRunnerRunPlanMemory();
  resetStrategicIntentMemory();
  return chooseAiAction(input, { persistTacticalPlanMemory: false });
}
