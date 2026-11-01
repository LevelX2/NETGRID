import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { runnerRunRiskContractReassessment } from "../../runner/run-window/run-window-assessment";
import type { ActiveRunnerRunRoot } from "../../plans/runner-run-origin-contract";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function checkpoint(previous = false) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta579-g5-before-known-payment${previous ? "-previous" : ""}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return cp;
}
function path() {
  const { input } = checkpoint();
  const ice = input.playerView.servers
    .find((s) => s.id === "hq")!
    .ice.find((c) =>
      c.effectiveRunQuote?.subroutines.some(
        (s) => s.type === "trash_installed_program_unless_runner_pays",
      ),
    )!;
  return { input, ice, rig: input.playerView.own.rig! };
}

it("quotes the native known program-protection payment before admitting the information run", () => {
  const { input } = checkpoint();
  const target = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find((t) => t.actionId === "runner.start_run.hq")!;
  expect(target.pathCost).toBe(1);
  expect(target.creditsAfterRun).toBe(6);
  expect(target.prerunReserveQuote).toMatchObject({
    status: "blocked",
    creditGap: 1,
    knownPathCost: 1,
    creditsAfterKnownPath: 6,
    unknownIceCount: 2,
  });
  expect(target.recommendation).toBe("gain_credits_first");
});

it("keeps the native parent scheduler and chooses legal preparation instead of the repeated doomed run", () => {
  const { input } = checkpoint();
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    checkpoint(true).runtime,
  );
  const unchanged = JSON.stringify(input),
    decision = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(unchanged);
  expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(decision.actionId).not.toBe("runner.start_run.hq");
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId)
      ?.expiresAtStateVersion,
  ).toBe(input.playerView.stateVersion);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toMatch(
    /^plan:runner\./,
  );
});

it("charges no protection payment without an installed program", () => {
  const { ice, rig } = path();
  expect(
    assessKnownRezzedIcePath(
      [ice],
      rig.filter((c) => c.type !== "program"),
      0,
    ),
  ).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 0,
    creditsAfterPath: 0,
  });
});

it("does not invent free sacrifice of the native rig when protection is unaffordable", () => {
  const { ice, rig } = path();
  expect(assessKnownRezzedIcePath([ice], rig, 0)).toMatchObject({
    blocked: true,
    canReachAccess: false,
    unpayableReason: "ice_unaffordable",
  });
});

it("uses a cheaper actual break and carries its restricted pool across the full known path", () => {
  const { ice, rig } = path();
  const second = structuredClone(ice);
  second.instanceId += "-second";
  second.effectiveRunQuote!.iceInstanceId = second.instanceId;
  const result = assessKnownRezzedIcePath([second, ice], rig, {
    credits: 0,
    icebreakerCredits: 2,
  });
  expect(result).toMatchObject({
    blocked: true,
    canReachAccess: false,
    visibleBreakCost: 3,
    creditsSpentBeforeUnpayableIce: 2,
  });
  expect(
    assessKnownRezzedIcePath([ice], rig, { credits: 0, icebreakerCredits: 2 }),
  ).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 2,
    creditsAfterPath: 0,
  });
});

it("allows the fully funded original route after reserving the known payment", () => {
  const { input } = checkpoint();
  input.playerView.own.credits += 1;
  const target = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find((t) => t.actionId === "runner.start_run.hq")!;
  expect(target.prerunReserveQuote).toMatchObject({
    status: "satisfied",
    creditGap: 0,
  });
  expect(target.pathCost).toBe(1);
});

it("preserves continuation after the budgeted payment while retaining an actual funding-gap exit", () => {
  const entry = checkpoint();
  entry.input.playerView.own.credits = 8;
  const target = evaluateRunnerRunTargets({
    input: entry.input,
    deckCapabilities: entry.input.ownDeckCapabilities!,
  }).find((t) => t.actionId === "runner.start_run.hq")!;
  const current = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta579-g5-after-known-payment.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(current.validation)).toEqual(Array(9).fill(true));
  const parent = current.runtime.residentPlanPortfolio.instances.find(
    (p: { moduleId: string }) => p.moduleId === "runner.pressure_central",
  );
  const signal = parent.moduleState.signal;
  const origin: ActiveRunnerRunRoot = {
    instanceId: parent.instanceId,
    purpose: signal.purpose,
    accessCommitment: signal.accessCommitment,
    runRiskContract: signal.runRiskContract,
    parentBinding: { moduleId: "runner.pressure_central", signal },
  };
  origin.runRiskContract!.reserveQuote = target.prerunReserveQuote!;
  origin.runRiskContract!.runnerCreditsAtEntry = 8;
  current.input.playerView.own.credits = 7;
  expect(
    runnerRunRiskContractReassessment(current.input, origin)?.decision,
  ).toBe("preserve_continuation");
  current.input.playerView.own.credits = 6;
  expect(
    runnerRunRiskContractReassessment(current.input, origin)?.decision,
  ).toBe("prefer_jack_out");
});

it.each([undefined, -1, 1.5, Number.NaN])(
  "fails closed for an incomplete or invalid program-payment quote (%s)",
  (amount) => {
    const { ice, rig } = path();
    if (amount === undefined)
      delete ice.effectiveRunQuote!.subroutines[0]!.amount;
    else ice.effectiveRunQuote!.subroutines[0]!.amount = amount;
    expect(() => assessKnownRezzedIcePath([ice], rig, 7)).toThrow(
      "runner_known_program_protection_payment_invalid_amount",
    );
  },
);
