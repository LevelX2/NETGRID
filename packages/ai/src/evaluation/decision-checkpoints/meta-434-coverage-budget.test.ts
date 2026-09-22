import { readFileSync } from "node:fs";
import type { LegalAction, VisibleCard } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function fixture() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r21-coverage-budget.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  return { cp, input: { ...cp.input, ...buildAiDecisionInputDto(cp.input) } };
}
afterEach(resetResidentPlanPortfolioMemory);

it.each([17, 21, 22, 24])(
  "keeps unaffordable damage prevention as a funding problem at %i credits",
  (credits) => {
    const { input } = fixture();
    input.playerView.own.credits = credits;
    const target = evaluateRunnerRunTargets({ input }).find(
      (t) => t.actionId === "runner.start_run.remote_1",
    )!;
    expect(target.routeQuote?.reachability).toBe("no_access");
    expect(target.pathPassability).toBe("blocked_unpayable");
    expect(["gain_credits_first", "do_not_run_now"]).toContain(
      target.recommendation,
    );
  },
);

it("does not install a duplicate breaker in the original Remote support chain", () => {
  const { cp, input } = fixture();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.draw_card");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.evidence).not.toContain(
    "plan_module:runner.rig_and_coverage",
  );
  expect(decision.evidence).toEqual(
    expect.arrayContaining([
      "plan_first_root:plan:runner.develop_board_and_hand:generic%3Adraw-options",
      "plan_first_executor:plan:runner.develop_board_and_hand:generic%3Adraw-options",
      "plan_step_id:plan:runner.develop_board_and_hand:generic%3Adraw-options:execute",
    ]),
  );
  expect(
    input.legalActions.some(
      (a: LegalAction) =>
        a.actionId === decision.actionId &&
        a.expiresAtStateVersion === input.playerView.stateVersion,
    ),
  ).toBe(true);
});

it("preserves actual missing coverage when the installed breaker is absent", () => {
  const { input } = fixture();
  input.playerView.own.rig = input.playerView.own.rig?.filter(
    (c: VisibleCard) => c.type !== "program",
  );
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(["blocked_unbreakable", "blocked_missing_coverage"]).toContain(
    target.pathPassability,
  );
  expect(target.recommendation).toBe("find_breaker_first");
});

it("retains the same installed breaker and admits its fully funded path", () => {
  const { input } = fixture();
  input.playerView.own.credits = 26;
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(target.pathPassability).toBe("reachable");
  expect(target.routeQuote?.reachability).toBe("guaranteed_access");
  expect(target.routeQuote?.fundingGap).toBe(0);
});
