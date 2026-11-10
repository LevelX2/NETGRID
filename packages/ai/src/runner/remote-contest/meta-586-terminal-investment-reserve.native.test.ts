import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { runnerTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta586-g18-d387-investment-reserve.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}

it("uses the last terminal Remote opportunity instead of protecting sunk program investment", () => {
  const input = checkpoint();
  expect(input.playerView.own.credits).toBe(18);
  expect(input.playerView.own.clicks).toBe(1);
  expect(input.playerView.opponent.agendaPoints).toBe(6);
  const visibleInputHash = () =>
    createHash("sha256")
      .update(
        JSON.stringify({
          playerView: input.playerView,
          legalActions: input.legalActions,
          deck: input.ownDeckSnapshot,
        }),
      )
      .digest("hex");
  const before = visibleInputHash();
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.start_run.remote_1");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.contest_remote");
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  // The runtime records the new risk contract in its planning fingerprint.
  // Engine facts, legal actions and the immutable own deck stay unchanged.
  expect(visibleInputHash()).toBe(before);
});

it("keeps the investment reserve when the same public Remote is not a terminal threat", () => {
  const input = checkpoint();
  input.playerView.opponent.agendaPoints = 2;
  expect(runnerTerminalContestThreat(input)).toBeUndefined();
  const decision = chooseAiAction(input);
  expect(decision.actionId).not.toBe("runner.start_run.remote_1");
  const remote = residentPlanPortfolioSnapshot(input)?.instances.find(
    (p) => p.moduleId === "runner.contest_remote",
  );
  expect(
    (
      remote?.moduleState as {
        signal?: { runRiskContract?: { reserveQuote?: unknown } };
      }
    )?.signal?.runRiskContract?.reserveQuote,
  ).toMatchObject({
    status: "blocked",
    riskTolerance: "standard",
    requiredCredits: 14,
  });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});

it("uses the same last opportunity against the advanced four-point threat", () => {
  const input = checkpoint();
  input.playerView.opponent.agendaPoints = 3;
  expect(runnerTerminalContestThreat(input)).toMatchObject({
    kind: "visible_four_point_remote",
    pointsNeeded: 4,
    remoteServerIds: ["remote_1"],
  });
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.start_run.remote_1");
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});
