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
import { preserveSelectedRunnerCoverageBindingAcrossPaymentStep } from "./coverage-bindings";
function original() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta592-r6-g12-d186-coverage-payment.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it("retains the selected urgent coverage search when payment-only rediscovery offers no run (SP-684)", () => {
  const { cp, input } = original();
  const before = JSON.stringify(input),
    prior = JSON.stringify(cp.runtime);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const d = chooseAiAction(input),
    p = residentPlanPortfolioSnapshot(input)!;
  const pending =
    cp.runtime.residentPlanPortfolio.pendingRunnerCostPenaltySupportOrigin;
  expect(d.actionId).toContain("chiba-bank-account");
  expect(input.legalActions.some((a: any) => a.actionId === d.actionId)).toBe(
    true,
  );
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  const leaf = p.instances.find(
    (x) => x.instanceId === pending.executorInstanceId,
  )!;
  const old = cp.runtime.residentPlanPortfolio.instances.find(
    (x: any) => x.instanceId === pending.executorInstanceId,
  );
  expect(leaf.moduleState).toMatchObject(old.moduleState);
  expect(leaf.viability).toBe(old.viability);
  expect(leaf.blockers).toEqual(old.blockers);
  expect(p.pendingRunnerCostPenaltySupportOrigin).toMatchObject(pending);
  expect(JSON.stringify(input)).toBe(before);
  expect(JSON.stringify(cp.runtime)).toBe(prior);
});
it.each([
  "exact",
  "wrong_prior_phase",
  "wrong_selected_action",
  "wrong_selected_version",
  "missing_binding",
  "wrong_role",
  "wrong_root",
])(
  "preserves only the exact original coverage payment despite a newly discovered draw phase: %s",
  (change) => {
    const { cp, input } = original(),
      previous = cp.runtime.residentPlanPortfolio,
      pending = previous.pendingRunnerCostPenaltySupportOrigin;
    const old = previous.instances.find(
      (x: any) => x.instanceId === pending.executorInstanceId,
    );
    const next = structuredClone(previous),
      leaf = next.instances.find(
        (x: any) => x.instanceId === pending.executorInstanceId,
      );
    leaf.moduleState = {
      kind: "coverage",
      phase: "draw_for_answer",
      gap: { requiredRole: old.moduleState.gap.requiredRole },
    };
    if (change === "wrong_prior_phase") old.moduleState.phase = "hold";
    if (change === "wrong_selected_action")
      old.moduleState.selectedSearchActionId = "another-action";
    if (change === "wrong_selected_version")
      old.moduleState.selectedSearchStateVersion--;
    if (change === "missing_binding")
      old.moduleState.gap.directSearchChoiceBindings = [];
    if (change === "wrong_role")
      leaf.moduleState.gap.requiredRole = "breaker_wall";
    if (change === "wrong_root") pending.rootPlanInstanceId = "another-root";
    const saved = JSON.stringify(previous),
      result: any = { lane: "plan", portfolio: next };
    const run = () =>
      preserveSelectedRunnerCoverageBindingAcrossPaymentStep(
        input,
        result,
        previous,
        pending,
      );
    if (change === "exact") {
      run();
      expect(leaf.moduleState).toEqual(old.moduleState);
    } else expect(run).toThrow(/invalid_support_graph/);
    expect(JSON.stringify(previous)).toBe(saved);
  },
);
