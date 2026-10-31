import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  evaluateRunnerRunTargets,
  quoteRunnerRunAfterHandBufferDraws,
} from "../../runner-run-target-evaluation";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function checkpoint() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta578-r2-g35-prospective-access.json",
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
function target(input: AiDecisionInputWithDeckCapabilities) {
  return evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find((t) => t.actionId === "runner.start_run.rd")!;
}
it("prepares for the known Data Darts damage before the unknown access instead of entering an already doomed run", () => {
  const { input, runtime } = checkpoint();
  expect(input.playerView.own.gripOrHq).toHaveLength(3);
  expect(target(input)).toMatchObject({
    pathPassability: "blocked_by_visible_damage_hand_buffer",
    recommendation: "draw_for_damage_buffer",
  });
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const unchanged = JSON.stringify(input),
    decision = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(unchanged);
  expect(decision).toMatchObject({
    actionId: "runner.draw_card",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toMatch(
    /^plan:runner\.(defense_and_recovery|pressure_central):/,
  );
});
it("admits the same route once five cards can absorb the three known damage and retain the access floor", () => {
  const { input } = checkpoint();
  input.playerView.own.gripOrHq.push(
    ...[1, 2].map((n) => ({
      ...input.playerView.own.gripOrHq[0]!,
      instanceId: `owned-buffer-${n}`,
    })),
  );
  expect(target(input)).toMatchObject({
    pathPassability: "reachable",
    recommendation: "run_now",
  });
});
it("accounts for actual damage prevention rather than demanding redundant hand cards", () => {
  const { input } = checkpoint();
  input.playerView.own.freeNetOrCoreDamagePreventionRemaining = 3;
  expect(target(input)).toMatchObject({
    pathPassability: "reachable",
    recommendation: "run_now",
  });
});

it("does not promise a draw prefix which consumes the run click", () => {
  const { input } = checkpoint();
  const run = target(input);
  input.playerView.own.clicks = 2;
  expect(quoteRunnerRunAfterHandBufferDraws(input, run)).toBeUndefined();
});
it("does not treat taxed draws as a free preparation prefix", () => {
  const { input } = checkpoint();
  const run = target(input);
  input.legalActions.find(
    (a) => a.type === "draw_card",
  )!.payload!.visibleDrawTaxSourceCount = 1;
  expect(quoteRunnerRunAfterHandBufferDraws(input, run)).toBeUndefined();
});

it("keeps preparing at four cards because the next known damage would leave one card and trigger the same exit", () => {
  const { input } = checkpoint();
  input.playerView.own.gripOrHq.push({
    ...input.playerView.own.gripOrHq[0]!,
    instanceId: "owned-single-buffer",
  });
  expect(target(input)).toMatchObject({
    pathPassability: "blocked_by_visible_damage_hand_buffer",
    recommendation: "draw_for_damage_buffer",
    prerunReserveQuote: { handBufferGap: 1 },
  });
});
