import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { aiLiveRuntimeDependencies } from "../../ai-runtime-public-entrypoints";
import { createAiLiveRuntimeComposition } from "../../runtime/ai-live-runtime-composition";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { archivesHasVisibleKnownAgenda } from "../../runtime/visible-server-agenda-facts";
import { runnerArchivesHasQualifiedHiddenPayoff } from "../../runtime/runner-archives-score";
afterEach(resetResidentPlanPortfolioMemory);
function fixture(name: string) {
  const f = JSON.parse(
    readFileSync(
      new URL("./fixtures/meta-ten-repairs/" + name, import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  return f;
}
describe("material funding competitor admission", () => {
  it("keeps R&D funding through the exact native two-to-three-credit transition", () => {
    const first = fixture("545-r3-g32-d521.json"),
      second = fixture("545-r3-g32-d522.json");
    const before = [JSON.stringify(first.input), JSON.stringify(second.input)];
    expect(archivesHasVisibleKnownAgenda(second.input)).toBe(false);
    expect(runnerArchivesHasQualifiedHiddenPayoff(second.input)).toBe(false);
    const runtime = createAiLiveRuntimeComposition(aiLiveRuntimeDependencies);
    restoreAiRuntimeCheckpoint(
      first.input,
      first.input.ownDeckSnapshot.deckSnapshotId,
      first.runtime,
    );
    const start = runtime.chooseAiAction(first.input);
    expect(start.decisionDebug!.planFirstDecision!.rootPlanInstanceId).toBe(
      "plan:runner.pressure_central:central%3Ard",
    );
    const result = runtime.chooseAiAction(second.input),
      pf = result.decisionDebug!.planFirstDecision!;
    expect(pf.rootPlanInstanceId).toBe(
      "plan:runner.pressure_central:central%3Ard",
    );
    expect(pf.selectedStep!.needId).toBe("run-support:central:rd");
    expect(result.actionId).toBe("runner.gain_credit");
    expect(result.fallbackUsed).toBe(false);
    expect(result.timeoutUsed).toBe(false);
    expect(pf.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: 521,
      planInstanceId: pf.selectedStep!.planInstanceId,
      stepId: pf.selectedStep!.stepId,
    });
    expect(
      second.input.legalActions.find(
        (a: { actionId: string }) => a.actionId === result.actionId,
      ).expiresAtStateVersion,
    ).toBe(521);
    expect([JSON.stringify(first.input), JSON.stringify(second.input)]).toEqual(
      before,
    );
  });
});
