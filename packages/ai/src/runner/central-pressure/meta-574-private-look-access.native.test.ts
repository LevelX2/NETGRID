import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { runPurposeForEvaluation } from "../../plans/runner-run-purpose";
afterEach(resetResidentPlanPortfolioMemory);
function fixture(name = "cp-meta574-private-look-mole.json") {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/" + name,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  if (!f.input.ownDeckCapabilities) throw new Error("Missing native deck capability projection");
  return f;
}
it("does not grant Mole access to an access-replacing private-look run, retaining actual R&D access", () => {
  const { input } = fixture();
  const before = JSON.stringify(input);
  const targets = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  });
  const look = targets.find(
    (t) => t.runActionProjection.accessReplacement === "private_look_top_rd",
  )!;
  const direct = targets.find((t) => t.actionId === "runner.start_run.rd")!;
  expect(look).toBeDefined();
  expect(look).toMatchObject({ multiaccessAvailable: false });
  expect(direct).toMatchObject({
    multiaccessAvailable: true,
    installedRunPayoff: { multiaccessAvailable: true },
  });
  expect(direct.score).toBeGreaterThan(look.score);
  expect(JSON.stringify(input)).toBe(before);
});
it("selects real hand and credit development instead of the falsely boosted information run", () => {
  const { input, runtime } = fixture();
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const before = JSON.stringify(input),
    decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId:
      "runner.play_event.runner_onr_classic_042_panzer-run_2.runner_onr_classic_042_panzer-run_2.onr_classic_042_panzer-run:on_play_gain_credits_and_draw",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.develop_board_and_hand:card%3Arunner_onr_classic_042_panzer-run_2",
  );
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(JSON.stringify(input)).toBe(before);
});

it.each([11, 39])(
  "retains information purpose instead of claiming agenda access in native G%i",
  (game) => {
    const { input } = fixture(
      "cp-meta574-g" + game + "-private-look-purpose.json",
    );
    const target = evaluateRunnerRunTargets({
      input,
      deckCapabilities: input.ownDeckCapabilities!,
    }).find(
      (t) => t.runActionProjection.accessReplacement === "private_look_top_rd",
    )!;
    expect(runPurposeForEvaluation(target)).toBe("information");
  },
);
it("retains liquid credits for held economic development instead of repeating a costly one-new-card look", () => {
  const { input, runtime } = fixture(
    "cp-meta574-g11-private-look-purpose.json",
  );
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId: "runner.gain_credit",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.economy");
});

it("retains an affordable first private look through its exact information route", () => {
  const { input, runtime } = fixture("cp-meta574-g12-first-private-look.json");
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const target = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find(
    (t) => t.runActionProjection.accessReplacement === "private_look_top_rd",
  )!;
  expect(target).toMatchObject({
    pathCost: 1,
    knownAccessState: "known_payoff",
    multiaccessAvailable: false,
  });
  expect(runPurposeForEvaluation(target)).toBe("information");
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ard",
  );
  const central = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) => p.instanceId === "plan:runner.pressure_central:central%3Ard",
  )!;
  expect(
    (central.moduleState as { signal: { runActionIds: string[] } }).signal
      .runActionIds,
  ).toContain(target.actionId);
});
it("does not use matchpoint access priority to relabel the native private look", () => {
  const { input, runtime } = fixture(
    "cp-meta574-g39-private-look-purpose.json",
  );
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const look = input.legalActions.find(
    (a) => a.payload?.successfulRunAccessReplacement === "private_look_top_rd",
  )!;
  expect(input.playerView.own.agendaPoints).toBe(6);
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(decision.actionId).not.toBe(look.actionId);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
});

it("does not treat an installed run-start ability as a passive bonus on another R&D action", () => {
  const { input } = fixture();
  const direct = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find((t) => t.actionId === "runner.start_run.rd")!;
  // The real Mole provides 90 immediate access value. Protocol grants no
  // effect at all to this different LegalAction.
  expect(direct.installedRunPayoff).toMatchObject({
    immediateAccessValue: 90,
    multiaccessAvailable: true,
  });
  expect(direct.installedRunPayoff.evidence).not.toContain(
    "installed_run_payoff:rd:topdeck_info",
  );
  expect(direct.installedRunPayoff.evidence).not.toContain(
    "installed_run_payoff:rd:access_replacement",
  );
});

it("does not admit an eight-credit private look through its ordinary-access sibling", () => {
  const { input, runtime } = fixture("cp-meta574-r2-g11-sibling-information.json");
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, runtime);
  const before = JSON.stringify(input);
  const targets = evaluateRunnerRunTargets({ input, deckCapabilities: input.ownDeckCapabilities! });
  const look = targets.find((t) => t.runActionProjection.accessReplacement === "private_look_top_rd")!;
  const direct = targets.find((t) => t.actionId === "runner.start_run.rd")!;
  expect(look).toMatchObject({ pathCost: 8, multiaccessAvailable: false });
  expect(runPurposeForEvaluation(look)).toBe("information");
  expect(look.score).toBeGreaterThan(direct.score);
  const decision = chooseAiAction(input);
  const central = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) => p.instanceId === "plan:runner.pressure_central:central%3Ard",
  )!;
  const signal = (central.moduleState as {
    signal: { runActionIds: string[]; runActionExclusions: Record<string, string[]> };
  }).signal;
  expect(signal.runActionIds).toContain(direct.actionId);
  expect(signal.runActionIds).not.toContain(look.actionId);
  expect(signal.runActionExclusions[look.actionId]).toContain(
    "runner_central_information_probe_known_path_not_admitted:rd",
  );
  expect(decision.actionId).not.toBe(look.actionId);
  expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(true);
  expect(JSON.stringify(input)).toBe(before);
});
