import { afterEach, expect, it } from "vitest";
import g9 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta518-g9d132.json";
import g12 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta518-g12d384.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { runnerAgendaStealCreditRequirement } from "../../run-analysis/runner-agenda-steal-cost";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";

afterEach(resetResidentPlanPortfolioMemory);
function inputFor(checkpoint: typeof g9 | typeof g12) {
  const cp = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
it.each([
  [
    g9,
    "runner.play_event.runner_onr_v1_108_score_2",
    "plan:runner.pressure_central:",
  ],
  [g12, "runner.gain_credit", "plan:runner.contest_remote:"],
])(
  "binds the original native decision to its parent's exact funding child",
  (cp, actionPrefix, rootPrefix) => {
    const input = inputFor(cp);
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).not.toBe(true);
    expect(decision.actionId).toContain(actionPrefix);
    const plan = decision.decisionDebug!.planFirstDecision!;
    expect(plan.rootPlanInstanceId).toContain(rootPrefix);
    expect(plan.selectedPlan!.moduleId).toBe("runner.economy");
    expect(plan.route).toMatchObject({
      actionId: decision.actionId,
      stateVersion: input.playerView.stateVersion,
    });
    expect(plan.route!.stepId).toBe(plan.selectedStep!.stepId);
    expect(plan.route!.planInstanceId).toBe(plan.leafExecutorInstanceId);
    expect(
      input.legalActions.some(
        (a) =>
          a.actionId === decision.actionId &&
          a.expiresAtStateVersion === input.playerView.stateVersion,
      ),
    ).toBe(true);
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  },
);
it("includes the known HQ agenda's self-cost before admitting access", () => {
  const input = inputFor(g9);
  const hq = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.hq",
  )!;
  expect(hq.accessPayoff).toBe("agenda");
  expect(hq.accessFacts.knownTargetDefinitionIds).toContain(
    "onr_proteus_004_fetal-ai",
  );
  expect(hq.routeQuote!.fundingGap).toBe(2);
  expect(hq.accessPayoffContestable).toBe(false);
  expect(hq.evidence).toContain("run_target_agenda_steal_credit_requirement:2");
});
it("quotes the complete native five-ICE path at nineteen credits, including a free Worm break", () => {
  const input = inputFor(g12),
    server = input.playerView.servers.find((s) => s.id === "remote_1")!;
  const path = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig!,
    19,
    server.root,
    input.playerView.opponent.credits,
  );
  expect(path).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 19,
    creditsAfterPath: 0,
  });
  const short = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig!,
    18,
    server.root,
    input.playerView.opponent.credits,
  );
  expect(short.canReachAccess).toBe(false);
  const snowbank = server.ice.filter(
    (c) => c.definitionId === "onr_proteus_038_snowbank",
  );
  expect(
    assessKnownRezzedIcePath(snowbank, input.playerView.own.rig!, 0)
      .canReachAccess,
  ).toBe(true);
  expect(assessKnownRezzedIcePath(snowbank, [], 0).canReachAccess).toBe(false);
  expect(assessKnownRezzedIcePath(snowbank, [], 1)).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 1,
  });
});
it("combines current public server costs and canonical known agenda costs without guessing missing facts", () => {
  const input = inputFor(g9),
    server = input.playerView.servers.find((s) => s.id === "hq")!;
  server.runnerAgendaStealCostQuote!.minimumCreditCost = 5;
  const known = ["onr_v1_196_corporate-war", "onr_proteus_004_fetal-ai"];
  expect(runnerAgendaStealCreditRequirement(input, "hq", known)).toBe(7);
  expect(runnerAgendaStealCreditRequirement(input, "hq")).toBe(5);
  expect(runnerAgendaStealCreditRequirement(input, "hq", [])).toBeUndefined();
  expect(
    runnerAgendaStealCreditRequirement(input, "hq", ["missing"]),
  ).toBeUndefined();
  expect(
    runnerAgendaStealCreditRequirement(input, "hq", ["onr_v1_039_krash"]),
  ).toBeUndefined();
  server.runnerAgendaStealCostQuote!.stateVersion--;
  expect(
    runnerAgendaStealCreditRequirement(input, "hq", known),
  ).toBeUndefined();
});
