import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function load(game: number, decision: number, credits?: number) {
  const { input, runtime } = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r19-g${game}-d${decision}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
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
  return input;
}

it.each([14, 16])(
  "preserves safe direct conversion without underquoted debt at %i credits",
  (credits) => {
    const input = load(33, 241, credits);
    const loan = input.legalActions.find(
      (a) => a.type === "install_card" && a.source.includes("loan-from-chiba"),
    )!;
    const result = chooseAiAction(input);
    expect(result.actionId).not.toBe(loan.actionId);
    expect(result.fallbackUsed).toBe(false);
    expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: input.playerView.stateVersion,
    });
    if (credits === 16) {
      expect(result.actionId).toBe("runner.start_run.remote_1");
      expect(
        result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
      ).toContain("plan:runner.contest_remote:");
      expect(
        result.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toContain("plan:runner.contest_remote:");
    } else {
      expect(result.actionId).toBe("runner.gain_credit");
      expect(
        result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
      ).toContain("plan:runner.economy:");
    }
  },
);

it("prices both same-encounter breaks once before the inner wall", () => {
  const input = load(33, 241);
  const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
  const quote = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig!,
    26,
    server.root,
    input.playerView.opponent.credits,
  );
  expect(quote).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 18,
    creditsAfterPath: 8,
  });
  expect(quote.paidSubroutineBreaks).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        subroutineId: "printed_subroutines_damage_net",
      }),
      expect.objectContaining({
        subroutineId: "printed_subroutines_prohibit_break_next_ice",
      }),
    ]),
  );
  expect(
    new Set(
      quote.paidSubroutineBreaks!.map(
        (s) => `${s.iceInstanceId}:${s.subroutineId}`,
      ),
    ).size,
  ).toBe(quote.paidSubroutineBreaks!.length);
});

it("retains the funding blocker for the cheaper damage branch when mitigation cannot be funded", () => {
  const input = load(33, 241, 16);
  const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
  const quote = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig!,
    16,
    server.root,
    input.playerView.opponent.credits,
  );
  expect(quote).toMatchObject({
    knownPathBlockedOnlyByDamage: true,
    visibleBreakCost: 16,
    creditsAfterPath: 0,
  });
  input.playerView.own.gripOrHq = [];
  const target = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find((t) => t.targetServerId === "remote_1")!;
  expect(target.pathPassability).toBe("blocked_unpayable");
});

it("does not request a hand buffer for a fully paid damage break", () => {
  const input = load(22, 152);
  const target = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find((t) => t.targetServerId === "remote_1")!;
  expect(target).toMatchObject({
    pathPassability: "reachable",
    pathCost: 14,
    creditsAfterRun: 0,
  });
  expect(target.recommendation).not.toBe("draw_for_damage_buffer");
});
