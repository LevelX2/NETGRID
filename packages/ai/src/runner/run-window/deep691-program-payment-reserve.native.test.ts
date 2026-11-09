import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { releaseAiMatchRuntime } from "../../runtime/match-runtime-memory";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { programProtectionEncounterPayment } from "./run-window-encounter-payment";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";

type NativeCheckpoint = {
  source: { index: number; root: string; executor: string };
  input: AiDecisionInputWithDeckCapabilities;
  runtime: Parameters<typeof restoreAiRuntimeCheckpoint>[2];
};
const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-deep691-program-payment-reserve.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { checkpoints: NativeCheckpoint[] };
afterEach(() => releaseAiMatchRuntime(fixture.checkpoints[0]!.input.matchId!));

function decide(index: number, contrast?: "extra_cash" | "empty_cloak") {
  const cp = fixture.checkpoints.find((c) => c.source.index === index);
  if (!cp) throw new Error("native_checkpoint_missing");
  const raw = structuredClone(cp.input);
  // These are unit contrasts to the unmodified native cases, not Engine branches.
  if (contrast === "extra_cash") raw.playerView.own.credits += 1;
  if (contrast === "empty_cloak") {
    const source = raw.playerView.own.rig?.find(
      (c) => c.definitionId === "onr_v1_011_cloak",
    );
    if (!source?.counters || !source.counterDisplays)
      throw new Error("native_cloak_pool_missing");
    source.counters.bit = 0;
    for (const display of source.counterDisplays) display.amount = 0;
  }
  const input = { ...raw, ...buildAiDecisionInputDto(raw) };
  if (!input.ownDeckSnapshot) throw new Error("native_deck_snapshot_missing");
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    structuredClone(cp.runtime),
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    structuredClone(cp.runtime.residentPlanPortfolio),
  );
  const selected = chooseAiAction(input);
  expect(selected.fallbackUsed).toBe(false);
  expect(selected.timeoutUsed).toBe(false);
  expect(selected.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    cp.source.root,
  );
  expect(
    selected.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toBe(cp.source.executor);
  expect(selected.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: selected.actionId,
    stateVersion: input.playerView.stateVersion,
  });
  const action = input.legalActions.find(
    (a) => a.actionId === selected.actionId,
  );
  expect(action?.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  return { selected, action };
}

describe("native P691 program-preservation payment and bound run reserve", () => {
  it("breaks the unboosted threat with restricted credits instead of spending the bound cash", () => {
    expect(decide(229).action?.type).toBe("break_subroutine");
  });
  it("starts the complete restricted-credit pump/break route after Coyote", () => {
    expect(decide(247).action?.type).toBe("pump_breaker");
  });
  it("retains the cash protection when one extra credit preserves continuation", () => {
    expect(decide(247, "extra_cash").action?.payload).toMatchObject({
      payOrTrashProgramSubroutinePayment: 1,
    });
  });
  it("still protects the rig when the empty restricted pool leaves no reserve-preserving break", () => {
    expect(decide(247, "empty_cloak").action?.payload).toMatchObject({
      payOrTrashProgramSubroutinePayment: 1,
    });
  });
  it("fails closed on a payment amount that contradicts the current Engine offer", () => {
    const raw = structuredClone(fixture.checkpoints[1]!.input);
    const input = { ...raw, ...buildAiDecisionInputDto(raw) };
    const action = input.legalActions.find(
      (a) => a.payload?.payOrTrashProgramSubroutinePayment === 1,
    );
    if (!action?.payload) throw new Error("native_program_payment_missing");
    action.payload.payOrTrashProgramSubroutinePayment = 2;
    expect(() => programProtectionEncounterPayment(input, action)).toThrow(
      PlanResolutionFailure,
    );
  });
});
