import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  evaluateRunnerRunTargets,
  quoteRunnerRunAfterHandBufferDraws,
} from "../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { releaseAiMatchRuntime } from "./match-runtime-memory";

const saved = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/cp-deep701-temporary-hand-buffer.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: Parameters<typeof restoreAiRuntimeCheckpoint>[2];
  validation: Record<string, boolean>;
};

afterEach(() => {
  releaseAiMatchRuntime(saved.input.matchId!);
  resetResidentPlanPortfolioMemory();
});
function original() {
  expect(Object.keys(saved.validation)).toHaveLength(9);
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  const raw = structuredClone(saved.input);
  return { ...raw, ...buildAiDecisionInputDto(raw) };
}
function rd(input: AiDecisionInputWithDeckCapabilities) {
  return evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.rd",
  )!;
}

it("quotes the funded same-turn draw beyond a core-reduced cleanup limit", () => {
  const input = original();
  expect(input.playerView.own).toMatchObject({
    credits: 61,
    clicks: 4,
    coreDamage: 3,
    maxHandSize: 2,
    stackOrRdCount: 12,
  });
  expect(input.playerView.own.gripOrHq).toHaveLength(2);
  const run = rd(input);
  expect(run).toMatchObject({
    pathPassability: "blocked_by_random_break_damage_hand_buffer",
    prerunReserveQuote: { status: "blocked", handBufferGap: 1, creditGap: 0 },
  });
  const before = JSON.stringify(input);
  expect(quoteRunnerRunAfterHandBufferDraws(input, run)).toMatchObject({
    actionId: run.actionId,
    targetServerId: "rd",
    pathPassability: "reachable",
    recommendation: "run_now",
    prerunReserveQuote: { status: "satisfied", handBufferGap: 0, creditGap: 0 },
  });
  expect(JSON.stringify(input)).toBe(before);
});

it("replans the native input through Defense instead of another credit", () => {
  const input = original();
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    structuredClone(saved.runtime),
  );
  // The checkpoint helper deliberately restarts the selected commitment.
  // Restoring the post-selection lease again would replay its old credit step.
  const before = JSON.stringify(input);
  const result = chooseAiAction(input);
  expect(result).toMatchObject({
    actionId: "runner.draw_card",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.defense_and_recovery:runner",
  );
  expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: input.playerView.stateVersion,
  });
  expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
    true,
  );
  expect(JSON.stringify(input)).toBe(before);
});

it.each(["last_click", "empty_stack", "draw_tax", "stale_draw"] as const)(
  "rejects an incomplete same-turn draw quote: %s",
  (variant) => {
    const input = original(),
      run = rd(input);
    const draw = input.legalActions.find((a) => a.type === "draw_card")!;
    if (variant === "last_click") input.playerView.own.clicks = 1;
    if (variant === "empty_stack") input.playerView.own.stackOrRdCount = 0;
    if (variant === "draw_tax") draw.payload!.visibleDrawTaxSourceCount = 1;
    if (variant === "stale_draw") draw.expiresAtStateVersion--;
    expect(quoteRunnerRunAfterHandBufferDraws(input, run)).toBeUndefined();
  },
);

it("preserves the independent lethal core-damage rejection on HQ", () => {
  const input = original();
  const hq = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.hq",
  )!;
  expect(hq.pathPassability).toBe("blocked_unbreakable");
  const prepared = quoteRunnerRunAfterHandBufferDraws(input, hq);
  expect(prepared?.pathPassability).not.toBe("reachable");
});
