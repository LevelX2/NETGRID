import { expect, it } from "vitest";
import derezCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r2-g3-d148.json";
import preparationCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r2-g13-d104.json";
import admittedPreparationCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r2-g13-d102.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function decide(checkpoint: unknown, credits?: number) {
  const { input, runtime } = structuredClone(checkpoint) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  if (credits !== undefined) input.playerView.own.credits = credits;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  return { input, decision: chooseAiAction(input) };
}

it("retains the preceding admitted R&D preparation before the reserve-blocked remote can interfere", () => {
  const { input, decision } = decide(admittedPreparationCheckpoint);
  const preparation = input.legalActions.find(
    (a) =>
      a.payload?.runnerAbility === "change_icebreaker_subtype" &&
      a.payload.selectedSubtype === "wall",
  )!;
  expect(input.playerView.own.credits).toBe(3);
  expect(decision.actionId).toBe(preparation.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
    route: { actionId: preparation.actionId, stateVersion: 101 },
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toContain(
    "plan:runner.rig_and_coverage:coverage%3Abreaker_wall%3Aprepare-run",
  );
});

it("continues the actual paid HQ access instead of derezzing a zero-rez-cost passed ICE", () => {
  const { input, decision } = decide(derezCheckpoint);
  expect(input.playerView.run).toMatchObject({
    attackedServerId: "hq",
    phase: "movement",
    position: { kind: "server" },
  });
  expect(decision.actionId).toBe("runner.continue_run");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_145",
    route: { actionId: "runner.continue_run", stateVersion: 147 },
  });
});

it.each([5, 6])(
  "admits the mode preparation exactly when its current reserve is funded: %i credits",
  (credits) => {
    // Controlled funding contrast, not another historical game state.
    const { input, decision } = decide(preparationCheckpoint, credits);
    const remote = evaluateRunnerRunTargets({ input }).find(
      (t) => t.targetServerId === "remote_1",
    )!;
    expect(remote.pathCost).toBe(3);
    const prepare = input.legalActions.find(
      (a) =>
        a.payload?.runnerAbility === "change_icebreaker_subtype" &&
        a.payload.selectedSubtype === "code_gate",
    )!;
    expect(prepare.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    if (credits === 5) {
      expect(remote.prerunReserveQuote?.status).toBe("blocked");
      expect(remote.prerunReserveQuote?.creditGap).toBeGreaterThan(0);
      expect(decision.actionId).not.toBe(prepare.actionId);
    } else {
      expect(remote.prerunReserveQuote?.status).toBe("satisfied");
      expect(remote.prerunReserveQuote?.creditGap).toBe(0);
      expect(decision.actionId).toBe(prepare.actionId);
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        route: { actionId: prepare.actionId, stateVersion: 103 },
      });
      expect(
        decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
      ).toContain(
        "plan:runner.rig_and_coverage:coverage%3Abreaker_code_gate%3Aprepare-run",
      );
    }
    expect(decision.fallbackUsed).toBe(false);
  },
);

it("does not undo a prepared R&D mode for a remote whose reserve is still unfunded", () => {
  const { input, decision } = decide(preparationCheckpoint);
  expect(
    input.playerView.own.rig!.find(
      (c) => c.definitionId === "onr_proteus_092_morphing-tool",
    )?.selectedSubtype,
  ).toBe("wall");
  expect(input.playerView.own.credits).toBe(3);
  expect(decision.actionId).toBe("runner.start_run.rd");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
    route: { actionId: "runner.start_run.rd", stateVersion: 103 },
  });
});
