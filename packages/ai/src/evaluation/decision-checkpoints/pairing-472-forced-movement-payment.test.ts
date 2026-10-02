import { readFileSync } from "node:fs";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { describe, expect, it } from "vitest";
import {
  chooseAiAction,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../../index";
import { restoreStrategicIntentMemorySnapshot } from "../../strategic-intent-memory";

type CapturedCheckpoint = {
  input: AiDecisionInputWithDeckCapabilities;
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
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-472-38-forced-movement-payment-d" +
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

function restore(captured: CapturedCheckpoint) {
  restoreStrategicIntentMemorySnapshot(
    captured.input,
    captured.runtime.strategicIntent,
    captured.input.ownDeckSnapshot!.deckSnapshotId,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    captured.input,
    captured.runtime.residentPlanPortfolio,
  );
}

const root = "plan:runner.pressure_central:central%3Ahq";
const executor = "plan:runner.convert_run_window:run%3Arun_242";

function expectPaymentContinuation() {
  const captured = checkpoint(260);
  const decision = chooseAiAction(captured.input);
  expect(decision).toMatchObject({
    actionId: "runner.continue_run",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(
    captured.input.legalActions.some((a) => a.actionId === decision.actionId),
  ).toBe(true);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: root,
    leafExecutorInstanceId: executor,
  });
}

describe("pairing 472: forced movement preserves encounter-payment ownership", () => {
  it("persists the existing run owner before Corp rez opens encounter payment", () => {
    const captured = checkpoint(258);
    restore(captured);
    const movement = chooseAiAction(captured.input);
    expect(movement).toMatchObject({
      actionId: "runner.continue_run",
      fallbackUsed: false,
      timeoutUsed: false,
    });
    expect(residentPlanPortfolioSnapshot(captured.input)).toMatchObject({
      stateVersion: 257,
      pendingRunnerCostPenaltySupportOrigin: {
        rootPlanInstanceId: root,
        executorInstanceId: executor,
        originalActionId: "runner.continue_run",
        selectedAtStateVersion: 257,
      },
    });
    expectPaymentContinuation();
  });

  it("keeps the same owner through the actual forced subroutine and movement sequence", () => {
    const first = checkpoint(257);
    restore(first);
    expect(chooseAiAction(first.input).actionId).toBe(
      first.input.legalActions[0]!.actionId,
    );
    expect(chooseAiAction(checkpoint(258).input).actionId).toBe(
      "runner.continue_run",
    );
    expectPaymentContinuation();
  });

  it("does not infer the missing owner from a historical payment window", () => {
    const captured = checkpoint(260);
    restore(captured);
    expect(() => chooseAiAction(captured.input)).toThrow(
      "window_origin_missing",
    );
  });

  it.each([
    "gap",
    "other_server",
    "other_run",
    "unrelated_action",
    "wrong_run_window",
  ] as const)("does not invent movement provenance after %s", (fault) => {
    const captured = checkpoint(258);
    if (fault === "gap")
      captured.input.eventTail = captured.input.eventTail!.filter(
        (e) => e.stateVersionBefore !== 255,
      );
    if (fault === "other_server")
      captured.input.eventTail!.find(
        (e) => e.stateVersionBefore === 256,
      )!.publicPayload.serverId = "rd";
    if (fault === "other_run")
      captured.input.playerView.run!.runId = "different";
    if (fault === "unrelated_action")
      captured.input.eventTail!.find(
        (e) => e.stateVersionBefore === 256,
      )!.publicPayload.actionType = "gain_credit";
    if (fault === "wrong_run_window") {
      const instance = captured.runtime.residentPlanPortfolio!.instances.find(
        (i) => i.instanceId === executor,
      )!;
      (
        instance.moduleState as { signal: { windowId: string } }
      ).signal.windowId = "run:different";
    }
    restore(captured);
    chooseAiAction(captured.input);
    expect(
      residentPlanPortfolioSnapshot(captured.input)
        ?.pendingRunnerCostPenaltySupportOrigin,
    ).toBeUndefined();
    const next = checkpoint(260).input;
    if (fault === "other_run") next.playerView.run!.runId = "different";
    expect(() => chooseAiAction(next)).toThrow("window_origin_missing");
  });
});
