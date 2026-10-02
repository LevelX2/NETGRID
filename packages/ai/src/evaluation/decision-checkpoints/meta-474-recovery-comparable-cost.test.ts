import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { runnerCostEffectiveCoverageRecovery } from "../../runner/rig-coverage/coverage-recovery";
function fixture() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-r1-g1-d32.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation).every((v) => v === true)).toBe(true);
  const i = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(i, i.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  return i;
}
afterEach(resetResidentPlanPortfolioMemory);
it("rejects false recovery savings caused by comparing differently funded trace paths", () => {
  const i = fixture(),
    server = i.playerView.servers.find((s) => s.id === "rd")!,
    rig = i.playerView.own.rig!,
    copy = i.playerView.own.gripOrHq.find(
      (c) => c.definitionId === "onr_v1_039_krash",
    )!,
    target = evaluateRunnerRunTargets({
      input: i,
    }).find((t) => t.targetServerId === "rd")!;
  expect(target.pathCost).toBe(15);
  const before = assessKnownRezzedIcePath(
      server.ice,
      rig,
      15,
      server.root,
      i.playerView.opponent.credits,
    ),
    after = assessKnownRezzedIcePath(
      server.ice,
      [...rig, copy],
      15,
      server.root,
      i.playerView.opponent.credits,
    );
  expect([before.visibleBreakCost, after.visibleBreakCost]).toEqual([7, 7]);
  const candidates = buildActionSemanticCandidates({
    legalActions: i.legalActions,
    observerSide: i.side,
    stateVersion: i.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      i.playerView.own.gripOrHq.map((c) => [c.instanceId, c.definitionId!]),
    ),
  });
  expect(
    runnerCostEffectiveCoverageRecovery(
      i,
      candidates,
      target,
      i.ownDeckCapabilities!,
    ),
  ).toBeUndefined();
  const decision = chooseAiAction(i);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.actionId).not.toContain(copy.instanceId);
  expect(i.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  const p = residentPlanPortfolioSnapshot(i)!;
  const executor = p.instances.find(
    (x) => x.instanceId === p.executorInstanceId,
  )!;
  expect(executor.moduleId).toBe(decision.decisionDebug!.planKind);
  expect(decision.decisionDebug!.planFirstDecision!.route).toMatchObject({
    actionId: decision.actionId,
    stateVersion: i.playerView.stateVersion,
    planInstanceId: p.executorInstanceId,
  });
});
