import { readFileSync } from "node:fs";
import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  chooseAiAction,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../index";
import { restoreStrategicIntentMemorySnapshot } from "../../strategic-intent-memory";
import { currentRunPathContext } from "../../run-analysis/current-run-path-context";
import { activeRunRootPlan } from "../../runner/run-window/run-window-origin";
import { runnerRunRiskContractReassessment } from "../../runner/run-window/run-window-assessment";

type CapturedCheckpoint = {
  input: AiDecisionInput;
  validation: Record<string, boolean>;
  runtime: {
    strategicIntent: Parameters<typeof restoreStrategicIntentMemorySnapshot>[1];
    residentPlanPortfolio: Parameters<
      typeof restoreResidentPlanPortfolioMemorySnapshot
    >[1];
  };
};

function checkpoint(index: number): CapturedCheckpoint {
  const captured = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-472-6-trace-context-d" +
          index +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as CapturedCheckpoint;
  expect(Object.values(captured.validation)).toEqual(Array(9).fill(true));
  return captured;
}

function restore(
  captured: CapturedCheckpoint,
  previousPortfolio = captured.runtime.residentPlanPortfolio,
) {
  restoreStrategicIntentMemorySnapshot(
    captured.input,
    captured.runtime.strategicIntent,
    captured.input.ownDeckSnapshot!.deckSnapshotId,
  );
  restoreResidentPlanPortfolioMemorySnapshot(captured.input, previousPortfolio);
}

const root = "plan:runner.pressure_central:central%3Ahq";
const executor = "plan:runner.convert_run_window:run%3Arun_162";

function expectContinuation(input: AiDecisionInput) {
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId: "runner.continue_run",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: root,
    leafExecutorInstanceId: executor,
  });
}

describe("pairing 472: active-run quotes retain current Engine trace support", () => {
  it("preserves the admitted HQ reserve and existing run owner at the real cold checkpoint", () => {
    const captured = checkpoint(164);
    // A captured decision includes its already evaluated same-version portfolio.
    // The actual incoming Runner portfolio is D162: only Corp D163 intervenes.
    const previous = checkpoint(162).runtime.residentPlanPortfolio;
    restore(captured, previous);
    const origin = activeRunRootPlan(previous, captured.input);
    expect(
      runnerRunRiskContractReassessment(captured.input, origin),
    ).toMatchObject({
      decision: "preserve_continuation",
      currentReserveQuote: {
        knownPathCost: 5,
        creditsAfterKnownPath: 5,
        creditGap: 0,
      },
    });
    expectContinuation(captured.input);
  });

  it("continues the actual warm HQ start after Corp declines without changing credits or rig", () => {
    const before = checkpoint(162);
    restore(before);
    expect(chooseAiAction(before.input).actionId).toBe("runner.start_run.hq");
    expectContinuation(checkpoint(164).input);
  });

  it.each(["absent", "exhausted", "credits_lost"] as const)(
    "still revalidates genuine current trace risk: %s",
    (mode) => {
      const captured = checkpoint(164);
      if (mode === "absent")
        delete captured.input.playerView.own.runnerTraceSupportQuote;
      if (mode === "exhausted") {
        captured.input.playerView.own.runnerTraceSupportQuote!.traceSuccessCancelOptions =
          [];
      }
      if (mode === "credits_lost") captured.input.playerView.own.credits = 9;
      const previous = checkpoint(162).runtime.residentPlanPortfolio;
      restore(captured, previous);
      const origin = activeRunRootPlan(previous, captured.input);
      expect(
        runnerRunRiskContractReassessment(captured.input, origin)?.decision,
      ).toBe("prefer_jack_out");
      expect(chooseAiAction(captured.input)).toMatchObject({
        actionId: "runner.jack_out",
        fallbackUsed: false,
        timeoutUsed: false,
      });
    },
  );

  it("carries the exact actor-private quote alongside paid encounter-tax facts", () => {
    const { input } = checkpoint(164);
    input.playerView.run!.encounterTaxForFutureIce = 4;
    const context = currentRunPathContext(input);
    expect(context.runnerTraceSupportQuote).toBe(
      input.playerView.own.runnerTraceSupportQuote,
    );
    expect(context.encounterEntryTax).toEqual({ amount: 4 });
    delete input.playerView.run!.encounterTaxForFutureIce;
    expect(currentRunPathContext(input).runnerTraceSupportQuote).toBe(
      input.playerView.own.runnerTraceSupportQuote,
    );
    expect(currentRunPathContext(input).encounterEntryTax).toBeUndefined();
  });
});
