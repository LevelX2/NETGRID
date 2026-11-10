import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { currentRuleTagRemovalCounterInput } from "./current-rule-tag-removal-counter.test-support";
import { bindPublicBoardStealQuoteCompanion } from "../../public-board-steal-quotes.test-support";
import { runnerTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";

function replay(
  game: number,
  number: number,
  currentRuleCountermodel = false,
  ordinaryCompanion = false,
) {
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
  let input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  if (currentRuleCountermodel) {
    // The stored snapshot predates the quantity-preserving DTO. Keep it
    // immutable and explicitly distinguish this current-rule countermodel.
    expect(() => chooseAiAction(input)).toThrow(/missing_action_semantics/);
    resetResidentPlanPortfolioMemory();
    input = currentRuleTagRemovalCounterInput(cp.input);
  }
  if (!input.playerView.run) bindPublicBoardStealQuoteCompanion(input);
  if (ordinaryCompanion) {
    input.playerView.opponent.agendaPoints = 2;
    expect(runnerTerminalContestThreat(input)).toBeUndefined();
  } else if (game === 9 || game === 33) {
    expect(runnerTerminalContestThreat(input)?.kind).toBe(
      "visible_four_point_remote",
    );
  }
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  if (game === 9 && number === 443) {
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    const executor = portfolio.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    )!;
    expect(executor.moduleState).toMatchObject({
      need: {
        targetCredits: ordinaryCompanion ? 10 : 8,
        currentCreditsAtRevalidation: 4,
        routeAssessment: {
          status: "covered_guaranteed",
          evidenceCodes: expect.arrayContaining(
            ordinaryCompanion
              ? [
                  "runner_funding_consumer_buffer_budget_uncovered:runner.play_event.runner_onr_classic_036_do-the-drine_1.runner_onr_classic_036_do-the-drine_1.1",
                  "runner_funding_consumer_hand_after_funding:2|required:4",
                  "runner_funding_consumer_buffer_repair_reserved:2|clicks:2|credits:0|action:runner.draw_card",
                ]
              : [
                  "runner_funding_consumer_hand_after_funding:3|required:4",
                  "runner_funding_consumer_buffer_repair_reserved:1|clicks:1|credits:0|action:runner.draw_card",
                ],
          ),
        },
      },
    });
  }
  return decision;
}

afterEach(resetResidentPlanPortfolioMemory);

it("rejects self-damage funding when buffer repair and the bound run cannot fit: G7 D420", () => {
  expect(replay(7, 420).actionId).not.toContain(
    "runner_onr_classic_036_do-the-drine",
  );
});

it.each([
  // Native four-point threats remove only the investment reserve. Buffer
  // repair still fits; the ordinary companions retain the original floor.
  [9, 443, 1, false],
  [21, 123, 2, false],
  [33, 246, 0, false],
  [9, 443, 2, true],
  [33, 246, 1, true],
] as const)(
  "preserves same-turn funding and its buffer: G%i D%i amount%i ordinary%s",
  (game, number, amount, ordinaryCompanion) => {
    const decision = replay(game, number, game === 33, ordinaryCompanion);
    if (amount === 0) {
      expect(decision.actionId).toBe("runner.start_run.remote_1");
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toBe("plan:runner.contest_remote:remote%3Aremote_1");
      expect(
        decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
      ).toBe("plan:runner.contest_remote:remote%3Aremote_1");
      return;
    }
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
