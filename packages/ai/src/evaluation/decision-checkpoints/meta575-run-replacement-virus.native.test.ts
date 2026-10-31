import { applyAction, hashGameState } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { PlanSchedulerResult } from "../../plans/plan-scheduler";
import {
  residentPlanPortfolioSnapshot,
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { reconcileSelectedRunnerSuccessfulReplacementChoice } from "../../runner/run-window/run-window-successful-replacement-continuation";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  stateHash: string;
  validation: Record<string, boolean>;
};

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta575-run-replacement-virus-sequence.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    beforeChoice: Capture;
    afterChoice: Capture;
    positive: Capture;
    engineBeforeChoice: GameState;
    originalPrefixProof: {
      checkedStates: number;
      originalAppliedPrefix: number;
    };
  };
}

function restoreLive(capture: Capture) {
  expect(Object.keys(capture.validation)).toHaveLength(9);
  expect(Object.values(capture.validation).every(Boolean)).toBe(true);
  capture.input.planningStateIdentity = buildPlanningStateIdentity(
    capture.input,
  );
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  // This is the persisted live continuation, not a process-restart replan.
  restoreResidentPlanPortfolioMemorySnapshot(
    capture.input,
    capture.runtime.residentPlanPortfolio,
  );
}

beforeEach(resetResidentPlanPortfolioMemory);

describe("pairing 575 successful-run replacement before broken-ICE counters", () => {
  it("preserves the run executor through the real credit choice and subsequent virus choice", () => {
    const f = fixture();
    expect(f.originalPrefixProof).toMatchObject({
      checkedStates: 260,
      originalAppliedPrefix: 259,
    });
    let state = f.engineBeforeChoice;
    expect(hashGameState(state)).toBe(f.beforeChoice.stateHash);
    restoreLive(f.beforeChoice);
    const previous = f.beforeChoice.runtime.residentPlanPortfolio!;
    for (const [index, capture] of [f.beforeChoice, f.afterChoice].entries()) {
      const input = capture.input;
      input.planningStateIdentity = buildPlanningStateIdentity(input);
      const before = JSON.stringify(input);
      const decision = chooseAiAction(input);
      expect(JSON.stringify(input)).toBe(before);
      expect(decision.actionId).toBe("runner.resolve_choice");
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.timeoutUsed).toBe(false);
      const portfolio = residentPlanPortfolioSnapshot(input)!;
      // The intermediate replacement must become the immediate predecessor.
      // The final run-end choice consumes that predecessor and closes the run.
      expect(portfolio.stateVersion).toBe(
        input.playerView.stateVersion - index,
      );
      expect(portfolio.rootForegroundInstanceId).toBe(
        previous.rootForegroundInstanceId,
      );
      expect(portfolio.executorInstanceId).toBe(previous.executorInstanceId);
      if (index === 0) {
        expect(decision.selectedChoices?.selectedOptionIds).toEqual(["pay_1"]);
      } else {
        expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
          lane: "engine_window",
          rootPlanInstanceId: previous.rootForegroundInstanceId,
          leafExecutorInstanceId: previous.executorInstanceId,
        });
        expect(decision.selectedChoices?.selectedOptionIds).toHaveLength(1);
        const selected = decision.selectedChoices?.selectedOptionIds;
        if (!Array.isArray(selected)) throw Error("Expected bound virus options");
        expect(
          input.playerView.pendingChoice!.options.map((o) => o.id),
        ).toContain(selected[0]);
      }
      const applied = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: decision.actionId!,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: decision.selectedChoices!,
      });
      expect(applied.ok).toBe(true);
      if (!applied.ok) throw Error(applied.error.message);
      state = applied.state;
      if (index === 0)
        expect(hashGameState(state)).toBe(f.afterChoice.stateHash);
    }
    expect(state.run).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
  });

  it("still rejects the old stale post-choice checkpoint without inventing its missing predecessor", () => {
    const { afterChoice } = fixture();
    restoreLive(afterChoice);
    expect(() => chooseAiAction(afterChoice.input)).toThrow(
      expect.objectContaining({ code: "window_origin_missing" }),
    );
  });

  it("keeps the original immediate virus choice on its existing run owner", () => {
    const { positive } = fixture();
    restoreLive(positive);
    const decision = chooseAiAction(positive.input);
    expect(decision.actionId).toBe("runner.resolve_choice");
    expect(decision.selectedChoices?.selectedOptionIds).toHaveLength(1);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId:
        positive.runtime.residentPlanPortfolio!.rootForegroundInstanceId,
      leafExecutorInstanceId:
        positive.runtime.residentPlanPortfolio!.executorInstanceId,
    });
  });

  it.each([
    "different_run",
    "missing_run_position",
    "different_executor",
    "inactive_commitment",
    "stale_previous",
    "missing_event",
    "different_event_server",
    "different_selected_action",
    "different_choice_source",
    "stale_choice",
    "different_option",
    "stale_legal_action",
    "different_window_origin",
  ])("does not advance an unbound replacement window: %s", (variant) => {
    const { beforeChoice } = fixture();
    const input = beforeChoice.input;
    const previous = beforeChoice.runtime.residentPlanPortfolio!;
    const run = input.playerView.run!;
    const version = input.playerView.stateVersion;
    const result: Extract<PlanSchedulerResult, { lane: "engine_window" }> = {
      lane: "engine_window",
      actionId: "runner.resolve_choice",
      origin: {
        rootPlanInstanceId: `run:${run.runId}`,
        leafPlanInstanceId: "rules.window_resolution",
        side: "runner",
        windowKind: "mandatory_choice",
        windowId: `${input.playerView.timingPoint}:${version}`,
        stateVersion: version,
        timingPoint: input.playerView.timingPoint,
      },
      portfolio: structuredClone(previous),
      diagnostics: [
        { stage: "window", code: "engine_window_single_legal_resolution" },
      ],
    };
    if (variant === "different_run") run.runId = "another_run";
    if (variant === "missing_run_position") delete run.position;
    if (variant === "different_executor")
      previous.executorInstanceId = previous.rootForegroundInstanceId!;
    if (variant === "inactive_commitment")
      previous.turnPlanCommitment!.status = "invalidated";
    if (variant === "stale_previous") previous.stateVersion--;
    if (variant === "missing_event") input.eventTail = [];
    if (variant === "different_event_server")
      input.eventTail!.at(-1)!.publicPayload.serverId = "rd";
    if (variant === "different_selected_action")
      result.actionId = "runner.unrelated_choice";
    if (variant === "different_choice_source")
      input.playerView.pendingChoice!.source = "other";
    if (variant === "stale_choice")
      input.playerView.pendingChoice!.stateVersion--;
    if (variant === "different_option")
      input.legalActions[0]!.choiceRequirements![0]!.optionIds[0] = "foreign";
    if (variant === "stale_legal_action")
      input.legalActions[0]!.expiresAtStateVersion--;
    if (variant === "different_window_origin")
      result.origin.rootPlanInstanceId = "run:other";
    const before = JSON.stringify(result.portfolio);
    expect(
      reconcileSelectedRunnerSuccessfulReplacementChoice(
        input,
        result,
        previous,
      ),
    ).toBe(false);
    expect(JSON.stringify(result.portfolio)).toBe(before);
  });
});
