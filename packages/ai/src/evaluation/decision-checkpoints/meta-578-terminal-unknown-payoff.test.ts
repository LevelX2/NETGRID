import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import {
  currentRunAbortAssessment,
  runnerRunWindowEncounterRequiredHandFloor,
} from "../../runner/run-window/run-window-assessment";
import type { ActiveRunnerRunRoot } from "../../plans/runner-run-origin-contract";
afterEach(resetResidentPlanPortfolioMemory);
function checkpoint() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta578-r4-g19-terminal-unknown-payoff.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const p = cp.runtime.residentPlanPortfolio.instances.find(
    (x: any) => x.moduleId === "runner.contest_remote",
  );
  const signal = p.moduleState.signal;
  const origin: ActiveRunnerRunRoot = {
    instanceId: p.instanceId,
    purpose: signal.purpose,
    accessCommitment: signal.accessCommitment,
    runRiskContract: signal.runRiskContract,
    parentBinding: { moduleId: "runner.contest_remote", signal },
  };
  if (origin.parentBinding?.moduleId !== "runner.contest_remote")
    throw new Error("Expected native contest parent");
  return { cp, origin, signal: origin.parentBinding.signal };
}
it("continues the admitted terminal unknown-root contest across a nonlethal damage floor instead of paying the outer ICE and aborting without new information", () => {
  const { cp, origin, signal } = checkpoint();
  expect(origin.accessCommitment?.payoff).toBe("unknown");
  expect(signal.terminalPatternThreat).toBe(true);
  expect(runnerRunWindowEncounterRequiredHandFloor(origin)).toBe(0);
  expect(currentRunAbortAssessment(cp.input, origin)).toBeUndefined();
  cp.input.planningStateIdentity = buildPlanningStateIdentity(cp.input);
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const unchanged = JSON.stringify(cp.input),
    d = chooseAiAction(cp.input);
  expect(JSON.stringify(cp.input)).toBe(unchanged);
  expect(d).toMatchObject({
    actionId: "runner.continue_run",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(d.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    origin.instanceId,
  );
});
it.each(["nonterminal", "information", "decline", "no-contract"] as const)(
  "does not waive ordinary safety for %s",
  (kind) => {
    const { cp, origin, signal } = checkpoint();
    if (kind === "nonterminal") signal.terminalPatternThreat = false;
    if (kind === "information") origin.purpose = "information";
    if (kind === "decline") origin.accessCommitment!.intendedAction = "decline";
    if (kind === "no-contract") delete origin.runRiskContract;
    expect(runnerRunWindowEncounterRequiredHandFloor(origin)).toBeUndefined();
    expect(currentRunAbortAssessment(cp.input, origin)).toMatchObject({
      evidenceCode: "runner_current_run_remaining_path_unreachable:remote_1",
    });
  },
);
it("retains the established known-score-threat exception", () => {
  const { origin } = checkpoint();
  origin.accessCommitment!.payoff = "score_threat";
  expect(runnerRunWindowEncounterRequiredHandFloor(origin)).toBe(0);
});
