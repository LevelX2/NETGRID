import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { aiLiveRuntimeDependencies } from "../../ai-runtime-public-entrypoints";
import { createAiLiveRuntimeComposition } from "../../runtime/ai-live-runtime-composition";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
afterEach(resetResidentPlanPortfolioMemory);
function fixture(d: number) {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "./fixtures/meta-ten-repairs/545-r3-g32-d" + d + ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  return f;
}
describe("marginal R&D reserve consumption", () => {
  it("converts the actually funded native three-state sequence without spending the remote bank on the known path", () => {
    const fixtures = [521, 522, 523].map(fixture),
      before = fixtures.map((f) => JSON.stringify(f.input));
    const observations: { sv: number; targets: RunnerRunTargetEvaluation[] }[] =
      [];
    const runtime = createAiLiveRuntimeComposition({
      ...aiLiveRuntimeDependencies,
      evaluateRunnerRunTargets: (p) => {
        const targets = aiLiveRuntimeDependencies.evaluateRunnerRunTargets(p);
        observations.push({ sv: p.input.playerView.stateVersion, targets });
        return targets;
      },
    });
    const first = fixtures[0]!;
    restoreAiRuntimeCheckpoint(
      first.input,
      first.input.ownDeckSnapshot.deckSnapshotId,
      first.runtime,
    );
    const results = fixtures.map((f) => runtime.chooseAiAction(f.input));
    expect(results.slice(0, 2).map((r) => r.actionId)).toEqual([
      "runner.gain_credit",
      "runner.gain_credit",
    ]);
    expect(results[2]!.actionId).toBe("runner.start_run.rd");
    for (let i = 0; i < 3; i++) {
      const f = fixtures[i]!,
        r = results[i]!,
        pf = r.decisionDebug!.planFirstDecision!;
      expect(r.fallbackUsed).toBe(false);
      expect(r.timeoutUsed).toBe(false);
      expect(pf.rootPlanInstanceId).toBe(
        "plan:runner.pressure_central:central%3Ard",
      );
      expect(pf.route).toMatchObject({
        actionId: r.actionId,
        stateVersion: f.input.playerView.stateVersion,
        planInstanceId: pf.selectedStep!.planInstanceId,
        stepId: pf.selectedStep!.stepId,
      });
      expect(
        f.input.legalActions.find(
          (a: { actionId: string }) => a.actionId === r.actionId,
        ).expiresAtStateVersion,
      ).toBe(f.input.playerView.stateVersion);
    }
    const third = observations
      .filter((o) => o.sv === 522)
      .at(-1)!
      .targets.find((t) => t.actionId === "runner.start_run.rd")!;
    expect(third).toMatchObject({
      recommendation: "run_now",
      creditsAfterRun: 4,
      fundingNeed: { reason: "none" },
      prerunReserveQuote: {
        status: "satisfied",
        requiredCredits: 4,
        creditGap: 0,
        unknownIceCount: 2,
        requiredHandBuffer: 3,
        handBufferGap: 0,
      },
    });
    expect(fixtures.map((f) => JSON.stringify(f.input))).toEqual(before);
  });
});
