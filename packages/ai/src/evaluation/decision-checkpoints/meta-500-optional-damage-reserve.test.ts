import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { optionalDamageBreakContinuationPayments } from "../../runner/run-window/run-window-encounter-budget";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function inputFixture(credits?: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-500-r2-g22-d397.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toHaveLength(9);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  if (credits !== undefined) input.playerView.own.credits = credits;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}

function fixture(credits?: number) {
  const input = inputFixture(credits);
  return { input, decision: chooseAiAction(input) };
}

afterEach(resetResidentPlanPortfolioMemory);

it.each([5, 6])(
  "keeps current ETR and unknown-ICE reserve funded before optional damage at %i credits",
  (credits) => {
    const { input, decision } = fixture(credits);
    expect(input.playerView.own.freeNetOrCoreDamagePreventionRemaining).toBe(2);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action.type).toBe("break_subroutine");
    expect(action.payload?.subroutineIndex).toBe(1);
    expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_387",
      route: {
        actionId: action.actionId,
        stateVersion: input.playerView.stateVersion,
      },
    });
  },
);

it("uses run-only credits for the complete optional and mandatory payment before the reserve check", () => {
  const input = inputFixture();
  input.playerView.run!.badPublicityCredits = 2;
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.payload?.subroutineIndex).toBe(0);
  const payments = optionalDamageBreakContinuationPayments(input, action);
  expect(payments).toHaveLength(1);
  const payment = payments[0]!;
  expect(payment.cost).toBe(4);
  expect(payment.budget.credits).toBe(3);
  expect(decision.fallbackUsed).toBe(false);
});

it("quotes the native optional and complete current mandatory break together", () => {
  const input = inputFixture();
  const action = input.legalActions.find(
    (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 0,
  )!;
  const payments = optionalDamageBreakContinuationPayments(input, action);
  expect(payments).toHaveLength(1);
  expect(payments[0]!.cost).toBe(4);
  expect(payments[0]!.budget.credits).toBe(1);
  expect(input.playerView.own.credits).toBe(5);
});

it("does not certify an exhaustive veto when a native mandatory quote disagrees with its action cost", () => {
  const input = inputFixture();
  const optional = input.legalActions.find(
    (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 0,
  )!;
  const mandatory = input.legalActions.find(
    (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 1,
  )!;
  mandatory.costs = [{ credits: 1 }];
  expect(optionalDamageBreakContinuationPayments(input, optional)).toEqual([]);
});

it("keeps an unquoted native mandatory payment continuation out of an exhaustive veto", () => {
  const input = inputFixture();
  const optional = input.legalActions.find(
    (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 0,
  )!;
  const mandatory = input.legalActions.find(
    (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 1,
  )!;
  mandatory.payload!.runnerCostPenaltySupportContinuation = true;
  expect(optionalDamageBreakContinuationPayments(input, optional)).toEqual([]);
});

it.each([
  "flatline",
  "core",
  "full-break",
  "secondary-effect",
  "zero-effect",
] as const)(
  "keeps %s obligations out of the optional reserve veto",
  (obligation) => {
    const input = inputFixture();
    const action = input.legalActions.find(
      (a) => a.type === "break_subroutine" && a.payload?.subroutineIndex === 0,
    )!;
    const subroutine =
      input.playerView.run!.encounteredIce!.effectiveRunQuote!.subroutines[0]!;
    if (obligation === "flatline") {
      input.playerView.own.gripOrHq = [];
      input.playerView.own.freeNetOrCoreDamagePreventionRemaining = 0;
    } else if (obligation === "core") subroutine.damageType = "core";
    else if (obligation === "full-break") {
      input.legalActions.find(
        (a) => a.type === "continue_run",
      )!.payload!.encounterFullBreakDamage = 1;
    } else if (obligation === "secondary-effect") {
      subroutine.unbrokenRunEffect!.increasesFutureBreakCostPerSubroutine = 1;
    } else subroutine.amount = 0;
    expect(optionalDamageBreakContinuationPayments(input, action)).toEqual([]);
  },
);

it("still admits optional damage protection when current breaks and the bound reserve are fully funded", () => {
  const { input, decision } = fixture(7);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.type).toBe("break_subroutine");
  expect(action.payload?.subroutineIndex).toBe(0);
  expect(decision.evidence).toContain(
    "plan_first_root:plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(decision.fallbackUsed).toBe(false);
});
