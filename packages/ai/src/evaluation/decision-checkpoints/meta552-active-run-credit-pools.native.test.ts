import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { completeEncounterBreakerPayment } from "../../runner/run-window/run-window-encounter-payment";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { visibleRunnerRunOnlyCredits } from "../../run-analysis/visible-run-credit-budget";
import {
  runnerEncounterCreditBudgetForInput,
  runnerEncounterPaymentForAction,
} from "../../runtime/runner-encounter-credit-budget";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function capture(key: string) {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta552-active-run-credit-pools.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).states[key] as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  return { ...f, input: { ...f.input, ...buildAiDecisionInputDto(f.input) } };
}

describe("native active run-only credit pools", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it.each(["g2", "g5", "positive"])(
    "spends the Engine's available pool at the bound break in %s",
    (key) => {
      const f = capture(key),
        input = f.input;
      expect(Object.keys(f.validation)).toHaveLength(9);
      expect(Object.values(f.validation).every(Boolean)).toBe(true);
      expect(input.playerView.run?.runnerRunTemporaryCredits?.remaining).toBe(
        9,
      );
      expect(runnerEncounterCreditBudgetForInput(input).runOnlyCredits).toBe(9);
      const hash = () =>
        createHash("sha256")
          .update(
            JSON.stringify({
              view: input.playerView,
              actions: input.legalActions,
              events: input.eventTail,
            }),
          )
          .digest("hex");
      const before = hash();
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        f.runtime,
      );
      const d = chooseAiAction(input);
      const action = input.legalActions.find((a) => a.actionId === d.actionId)!;
      expect(action.type).toBe("break_subroutine");
      if (key === "g2") expect(action.payload?.subroutineIndexes).toBe("0");
      else expect(action.payload?.subroutineIndex).toBe(0);
      expect(d.fallbackUsed).toBe(false);
      expect(d.timeoutUsed).toBe(false);
      const p = d.decisionDebug?.planFirstDecision;
      expect(p?.rootPlanInstanceId).toBe(
        `plan:runner.pressure_central:central%3A${key === "g2" ? "hq" : "rd"}`,
      );
      expect(p?.selectedPlan?.moduleId).toBe("runner.convert_run_window");
      expect(p?.route).toMatchObject({
        actionId: d.actionId,
        stateVersion: input.playerView.stateVersion,
      });
      expect(p?.route?.planInstanceId).toBe(p?.leafExecutorInstanceId);
      expect(p?.selectedStep?.planInstanceId).toBe(p?.leafExecutorInstanceId);
      const payment = runnerEncounterPaymentForAction(input, action);
      expect(payment).toMatchObject({
        affordable: true,
        cashCost: 0,
        creditsAfterPayment: input.playerView.own.credits,
      });
      expect(payment.budget.runOnlyCredits).toBe(9 - payment.totalCost);
      expect(hash()).toBe(before);
    },
  );
  it.each(["g5", "positive"])(
    "preserves the general-credit subset into the next ICE after %s",
    (key) => {
      const { input } = capture(key);
      const action = input.legalActions.find(
        (a) => a.type === "break_subroutine",
      )!;
      const payment = completeEncounterBreakerPayment(input, action)!;
      expect(payment).toBeDefined();
      expect(payment.cashCost).toBe(0);
      const traceInput = JSON.parse(
        readFileSync(
          new URL(
            "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta552-trace-eligible-run-credits.json",
            import.meta.url,
          ),
          "utf8",
        ),
      ).states.start.input as AiDecisionInputWithDeckCapabilities;
      const traceIce = traceInput.playerView.servers.find(
        (s) => s.id === "hq",
      )!.ice;
      const path = assessKnownRezzedIcePath(
        traceIce,
        [],
        payment.budget,
        [],
        0,
      );
      expect(path.visibleIceRunHazards?.[0]).toMatchObject({
        runnerTraceCapacity: input.playerView.own.credits,
        baseTraceCovered: false,
        unavoidable: true,
      });
      expect(path.creditBudgetAfterPath?.traceEligibleCredits).toBe(
        input.playerView.own.credits,
      );
      expect(path.creditBudgetAfterPath?.credits).toBeGreaterThan(
        input.playerView.own.credits,
      );
    },
  );
  it("combines actual run-only pools without exposing them as general cash", () => {
    const f = capture("g2");
    const run = { ...f.input.playerView.run!, badPublicityCredits: 2 };
    expect(visibleRunnerRunOnlyCredits(run)).toBe(11);
    expect(visibleRunnerRunOnlyCredits(undefined)).toBe(0);
    expect(f.input.playerView.own.credits).toBe(2);
  });
  it.each([-1, 1.5, Number.NaN])(
    "fails closed on an invalid current pool %s",
    (remaining) => {
      const run = capture("g2").input.playerView.run!;
      expect(() =>
        visibleRunnerRunOnlyCredits({
          ...run,
          runnerRunTemporaryCredits: {
            ...run.runnerRunTemporaryCredits!,
            remaining,
          },
        }),
      ).toThrow("invalid_run_only_credit_pool");
    },
  );
});
