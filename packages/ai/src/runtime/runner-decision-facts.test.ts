import { describe, expect, it, vi } from "vitest";

import { aiLiveRuntimeDependencies } from "../ai-runtime-public-entrypoints";
import { buildRealEngineDecisionCorpusScenarios } from "../evaluation/real-engine-decision-corpus-fixtures";
import * as runWindowSignals from "../runner/run-window/run-window-discovery";
import { createAiLiveRuntimeComposition } from "./ai-live-runtime-composition";

const scenarios = buildRealEngineDecisionCorpusScenarios();

describe("Runner decision facts", () => {
  it.each([
    {
      scenarioId: "runner_real_target_choice_discard_choice",
      handFrames: 1,
      resourceFrames: 1,
      expectedDecision: {
        actionId: "runner.resolve_choice",
        reasonCode: "plan_first.runner.defense_and_recovery",
        selectedChoices: {
          choiceId: "discard_runner_5",
          selectedOptionIds: ["card_runner_simple_run_event_2"],
        },
      },
    },
    {
      scenarioId: "runner_real_empty_hand_draw",
      handFrames: 1,
      resourceFrames: 1,
      expectedDecision: {
        actionId: "runner.start_run.rd",
        reasonCode: "plan_first.runner.pressure_central",
      },
    },
    {
      scenarioId: "runner_real_damage_buffer_needed",
      handFrames: 2,
      resourceFrames: 1,
      expectedDecision: {
        actionId: "runner.draw_card",
        reasonCode: "plan_first.runner.defense_and_recovery",
      },
    },
    {
      scenarioId: "runner_real_run_blocked_missing_coverage",
      handFrames: 2,
      resourceFrames: 2,
      expectedDecision: {
        actionId:
          "runner.play_event.runner_simple_run_event_1.rd.runner_simple_run_event_1.simple_run_event:simple_run_event_on_play",
        reasonCode: "plan_first.runner.pressure_central",
      },
    },
  ])(
    "evaluates only the required frames for $scenarioId",
    ({ scenarioId, handFrames, resourceFrames, expectedDecision }) => {
      const scenario = scenarios.find(
        (entry) => entry.scenarioId === scenarioId,
      );
      if (!scenario) throw new Error(`Missing Engine scenario ${scenarioId}.`);

      const evaluateRunnerHandDevelopment = vi.fn(
        aiLiveRuntimeDependencies.evaluateRunnerHandDevelopment,
      );
      const buildRunnerEconomyPosture = vi.fn(
        aiLiveRuntimeDependencies.buildRunnerEconomyPosture,
      );
      const evaluateRunnerRunTargets = vi.fn(
        aiLiveRuntimeDependencies.evaluateRunnerRunTargets,
      );
      const buildRunWindows = vi.spyOn(
        runWindowSignals,
        "buildRunnerRunWindowSignals",
      );
      try {
        const runtime = createAiLiveRuntimeComposition({
          ...aiLiveRuntimeDependencies,
          evaluateRunnerHandDevelopment,
          buildRunnerEconomyPosture,
          evaluateRunnerRunTargets,
        });
        const decision = runtime.chooseAiAction(scenario.input, {
          persistTacticalPlanMemory: false,
        });

        expect(decision).toMatchObject(expectedDecision);
        expect(evaluateRunnerHandDevelopment).toHaveBeenCalledTimes(handFrames);
        expect(buildRunnerEconomyPosture).toHaveBeenCalledTimes(resourceFrames);
        expect(evaluateRunnerRunTargets).toHaveBeenCalledTimes(resourceFrames);
        expect(buildRunWindows).toHaveBeenCalledTimes(1);
        for (const [
          index,
          [, prepared],
        ] of evaluateRunnerRunTargets.mock.calls.entries()) {
          expect(prepared?.economy).toBe(
            buildRunnerEconomyPosture.mock.results[index]?.value,
          );
          expect(prepared?.projections).toBe(
            evaluateRunnerRunTargets.mock.calls[0]?.[1]?.projections,
          );
        }
        if (handFrames > 1) {
          const [before, baseCards] =
            evaluateRunnerHandDevelopment.mock.calls[0]!;
          const [after, projectedCards] =
            evaluateRunnerHandDevelopment.mock.calls[1]!;
          expect(before.rigDemandProjection).toBeUndefined();
          expect(after.rigDemandProjection?.roleDemands.length).toBeGreaterThan(
            0,
          );
          expect(projectedCards).toBe(baseCards);
        }
      } finally {
        buildRunWindows.mockRestore();
      }
    },
  );
});
