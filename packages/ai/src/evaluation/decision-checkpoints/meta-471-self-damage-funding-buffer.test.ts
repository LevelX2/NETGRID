import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";

function replay(game: number, number: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-471-r6-g${game}-d${number}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation).every((value) => value === true)).toBe(
    true,
  );
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  return decision;
}

afterEach(resetResidentPlanPortfolioMemory);

it("rejects self-damage funding when buffer repair and the bound run cannot fit: G7 D420", () => {
  expect(replay(7, 420).actionId).not.toContain(
    "runner_onr_classic_036_do-the-drine",
  );
});

it.each([
  [9, 443, 1],
  [21, 123, 2],
  [33, 246, 1],
])(
  "preserves feasible same-turn funding, buffer repair and the exact parent: G%i D%i",
  (game, number, amount) => {
    const decision = replay(game, number);
    const copy = game === 33 ? 2 : 1;
    expect(decision.actionId).toBe(
      `runner.play_event.runner_onr_classic_036_do-the-drine_${copy}.runner_onr_classic_036_do-the-drine_${copy}.${amount}`,
    );
    expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      "plan:runner.contest_remote:remote%3Aremote_1",
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toBe("plan:runner.economy:run-support%3Aremote%3Aremote_1");
  },
);
