import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  completeCancellableEncounterPayment,
  completeEncounterBreakerPayment,
} from "../../runner/run-window/run-window-encounter-payment";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const checkpoint = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-deep627-runner-cancellable-strength-d329.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};

describe("native cancellable encounter effect payment", () => {
  // Controlled boundary inputs retain the native shape; they are not additional
  // captured Engine states or hidden-information permutations.
  const boundary = () => {
    const input = structuredClone(checkpoint.input);
    const action = input.legalActions.find(
      (a) => a.type === "continue_run" && a.payload?.encounterContinue === true,
    )!;
    const ice = input.playerView.run!.encounteredIce!;
    return { input, action, quote: ice.effectiveRunQuote! };
  };

  it.each([0, 2, 5])(
    "quotes the complete cancellation payment %i without mutating the input",
    (cost) => {
      const { input, action, quote } = boundary();
      quote.subroutines[0]!.runFutureStrengthCancelPaymentAmount = cost;
      const before = JSON.stringify(input);
      expect(completeCancellableEncounterPayment(input, action)).toMatchObject({
        cost,
        cashCost: cost,
        liquidCreditsAfterPayment: 15 - cost,
        runEndTrashSourceIds: [],
      });
      expect(action.costs).toEqual([]);
      expect(JSON.stringify(input)).toBe(before);
    },
  );

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an invalid cancellation quote %s",
    (cost) => {
      const { input, action, quote } = boundary();
      quote.subroutines[0]!.runFutureStrengthCancelPaymentAmount = cost;
      expect(
        completeCancellableEncounterPayment(input, action),
      ).toBeUndefined();
    },
  );

  it("does not invent a missing cancellation amount", () => {
    const { input, action, quote } = boundary();
    delete quote.subroutines[0]!.runFutureStrengthCancelPaymentAmount;
    expect(completeCancellableEncounterPayment(input, action)).toBeUndefined();
  });

  it("does not remove another effect with the same numeric metadata", () => {
    const { input, action, quote } = boundary();
    quote.subroutines[0]!.type = "end_the_run";
    expect(completeCancellableEncounterPayment(input, action)).toBeUndefined();
  });

  it("requires one exact unresolved effect rather than cancelling a mixed scope", () => {
    const { input, action, quote } = boundary();
    quote.subroutines.push({
      ...quote.subroutines[0]!,
      id: "another_future_effect",
    });
    Object.assign(action.payload!, {
      unbrokenSubroutineCount: 2,
      encounterRemainingSubroutineCount: 2,
      encounterSubroutineIds: quote.subroutines.map((s) => s.id).join(","),
      encounterRemainingSubroutineIds: quote.subroutines
        .map((s) => s.id)
        .join(","),
    });
    expect(completeCancellableEncounterPayment(input, action)).toBeUndefined();
  });

  it("keeps the full-break damage obligation", () => {
    const { input, action } = boundary();
    action.payload!.encounterFullBreakDamage = 2;
    expect(completeCancellableEncounterPayment(input, action)).toBeUndefined();
  });

  it("does not quote the cancellation as a breaker action", () => {
    const { input } = boundary();
    const action = input.legalActions.find(
      (a) => a.type === "break_subroutine",
    )!;
    expect(completeCancellableEncounterPayment(input, action)).toBeUndefined();
  });

  it("requires currently available general or run credits", () => {
    const { input, action } = boundary();
    input.playerView.own.credits = 1;
    expect(completeCancellableEncounterPayment(input, action)).toBeUndefined();
  });

  it("keeps a breaker-funded reply when its restricted pool cannot pay the cancellation", () => {
    const { input, action } = boundary();
    input.playerView.own.credits = 1;
    input.playerView.own.rig!.push({
      instanceId: "synthetic-breaker-credit-pool",
      known: true,
      type: "hardware",
      counterDisplays: [
        {
          id: "restricted-bits",
          amount: 6,
          displayKind: "restricted_pool",
          label: "Breakercredits",
          ariaLabel: "6 Breakercredits",
          creditPool: {
            kind: "restricted_credit",
            uses: ["using_icebreaker_during_run"],
          },
        },
      ],
    });
    const breakAction = input.legalActions.find(
      (a) => a.type === "break_subroutine",
    )!;
    expect(completeEncounterBreakerPayment(input, breakAction)).toMatchObject({
      cost: 6,
      cashCost: 0,
      liquidCreditsAfterPayment: 1,
    });
    expect(completeCancellableEncounterPayment(input, action)).toBeUndefined();
  });

  it("allows a legal run-only pool without spending breaker credits", () => {
    const { input, action } = boundary();
    input.playerView.own.credits = 0;
    input.playerView.run!.badPublicityCredits = 2;
    expect(completeCancellableEncounterPayment(input, action)).toMatchObject({
      cost: 2,
      cashCost: 0,
      liquidCreditsAfterPayment: 0,
    });
  });

  it("preserves the Run parent while declining a six-credit break with a two-credit cancellation route", () => {
    expect(Object.keys(checkpoint.validation)).toHaveLength(9);
    expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
    const { input, runtime } = structuredClone(checkpoint);
    const before = JSON.stringify(input.playerView);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(
      "runner.continue_run.subroutine_run_duration_ice_strength",
    );
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    expect(JSON.stringify(input.playerView)).toBe(before);
    const plan = decision.decisionDebug!.planFirstDecision!;
    expect(plan.rootPlanInstanceId).toBe(
      "plan:runner.pressure_central:central%3Ahq",
    );
    expect(plan.leafExecutorInstanceId).toBe(
      "plan:runner.convert_run_window:run%3Arun_318",
    );
    expect(plan.route?.actionId).toBe(decision.actionId);
    expect(plan.route?.stateVersion).toBe(328);
  });
});
