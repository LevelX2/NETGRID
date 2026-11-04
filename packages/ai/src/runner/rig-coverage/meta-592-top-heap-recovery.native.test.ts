import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
function original() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta592-r7-g14-d651-junkyard-terminal.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it("admits the native exact top-heap recovery, installation and terminal remote run (SP-339)", () => {
  const { cp, input } = original(),
    before = JSON.stringify(input),
    runtimeBefore = JSON.stringify(cp.runtime),
    d = chooseAiAction(input);
  expect(d.actionId).toContain("junkyard-bbs");
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  expect(input.legalActions.some((a: any) => a.actionId === d.actionId)).toBe(
    true,
  );
  const p = residentPlanPortfolioSnapshot(input)!;
  expect(
    p.instances.some(
      (x) =>
        x.moduleId === "runner.rig_and_coverage" &&
        (x.moduleState as any).gap?.priorityClass === "P2" &&
        (x.moduleState as any).gap?.targetServerId === "remote_1" &&
        (x.moduleState as any).gap?.directSearchActionIds.includes(d.actionId),
    ),
  ).toBe(true);
  expect(JSON.stringify(input)).toBe(before);
  expect(JSON.stringify(cp.runtime)).toBe(runtimeBefore);
});
