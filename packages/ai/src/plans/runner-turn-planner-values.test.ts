import { expect, it } from "vitest";
import { runnerEvaluationValues } from "./runner-turn-planner-values";

it("subtracts cleanup costs from existing development value", () => {
  expect(
    runnerEvaluationValues("runner.develop_board_and_hand", 1_800, -1_000),
  ).toEqual({ hand_quality: 800 });
  expect(
    runnerEvaluationValues("runner.economy", 1_800, -1_000),
  ).toEqual({ economy: 1_800, hand_quality: -1_000 });
});
