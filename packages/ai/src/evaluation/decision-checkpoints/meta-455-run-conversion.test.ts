import { bindSyntheticAgendaStealQuotes } from "../../agenda-steal-quotes.test-support";
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

function decide(checkpoint: unknown, credits?: number, clicks?: number) {
  const { input, runtime } = structuredClone(checkpoint) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  if (!input.playerView.run) {
    bindSyntheticAgendaStealQuotes(input, "rd", 0, {});
    bindSyntheticAgendaStealQuotes(input, "r1", 0, {});
  }
  if (credits !== undefined) input.playerView.own.credits = credits;
  if (clicks !== undefined) input.playerView.own.clicks = clicks;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  return { input, decision: chooseAiAction(input) };
}

it("retains admitted R&D preparation when the remote funding prefix no longer fits", () => {
  const { input, decision } = decide(admittedPreparationCheckpoint, 3, 2);
  const preparation = input.legalActions.find(
    (a) =>
      a.payload?.runnerAbility === "change_icebreaker_subtype" &&
      a.payload.selectedSubtype === "wall",
  )!;
  expect(input.playerView.own.credits).toBe(3);
  expect(decision.actionId).toBe(preparation.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "pa90fufw9vc5bkshp96ztlryxl",
    route: { actionId: preparation.actionId, stateVersion: 101 },
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.portfolio.find(
      (instance) => instance.instanceId === decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ),
  ).toMatchObject({
    moduleId: "runner.rig_and_coverage",
    dedupeKey: expect.stringContaining("coverage:breaker_wall:prepare-run"),
  });
});

it("funds the urgent remote while its two-credit prefix and run still fit", () => {
  const { input, decision } = decide(admittedPreparationCheckpoint);
  expect(input.playerView.own.clicks).toBe(4);
  expect(decision.actionId).toBe("rb");
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
    leafExecutorInstanceId:
      "p8dvcw6jj6cbaz1qxlt9ksvoh5",
  });
  expect(
    evaluateRunnerRunTargets({ input }).find(
      (target) => target.actionId === "rs.r1",
    )?.prerunReserveQuote,
  ).toMatchObject({ status: "blocked", creditGap: 2 });
});

it("continues the actual paid HQ access instead of derezzing a zero-rez-cost passed ICE", () => {
  const { input, decision } = decide(derezCheckpoint);
  expect(input.playerView.run).toMatchObject({
    attackedServerId: "hq",
    phase: "movement",
    position: { kind: "server" },
  });
  expect(decision.actionId).toBe("r5");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    leafExecutorInstanceId: "p9nrt9qr2388lgyd4a2j3uyfr0",
    route: { actionId: "r5", stateVersion: 147 },
  });
});

it.each([5, 6])(
  "admits the mode preparation exactly when its current reserve is funded: %i credits",
  (credits) => {
    // Controlled funding contrast, not another historical game state.
    const { input, decision } = decide(preparationCheckpoint, credits);
    const remote = evaluateRunnerRunTargets({ input }).find(
      (t) => t.targetServerId === "r1",
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
        rootPlanInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
        route: { actionId: prepare.actionId, stateVersion: 103 },
      });
      expect(
        decision.decisionDebug?.planFirstDecision?.portfolio.find(
          (instance) => instance.instanceId === decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
        ),
      ).toMatchObject({
        moduleId: "runner.rig_and_coverage",
        dedupeKey: expect.stringContaining("coverage:breaker_code_gate:prepare-run"),
      });
    }
    expect(decision.fallbackUsed).toBe(false);
  },
);

it("does not undo a prepared R&D mode for a remote whose reserve is still unfunded", () => {
  const { input, decision } = decide(preparationCheckpoint);
  expect(
    input.playerView.own.rig!.find(
      (c) => c.definitionId === 150,
    )?.selectedSubtype,
  ).toBe("wall");
  expect(input.playerView.own.credits).toBe(3);
  expect(decision.actionId).toBe("rb");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "pc7ebuiw5dxhlbzbf1nhcs4p4z",
    route: { actionId: "rb", stateVersion: 103 },
  });
});
