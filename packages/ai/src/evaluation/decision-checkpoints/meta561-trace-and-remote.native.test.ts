import { applyAction, hashGameState } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { reconstructBeliefState } from "../../belief-state";
import type { PlanSchedulerResult } from "../../plans/plan-scheduler";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import {
  residentPlanPortfolioSnapshot,
  resetResidentPlanPortfolioMemory,
} from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { reconcileSelectedRunnerCostPenaltySupportOrigin } from "../../runner/run-window/run-window-cost-continuation";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
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
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta561-trace-and-remote.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    bid: Capture;
    payment: Capture;
    remote: Capture;
    engineBeforeBid: GameState;
    originalPrefixProof: {
      checkedStates: number;
      originalAppliedPrefix: number;
    };
  };
  for (const capture of [f.bid, f.payment, f.remote]) {
    expect(Object.keys(capture.validation)).toHaveLength(9);
    expect(Object.values(capture.validation).every(Boolean)).toBe(true);
    capture.input.planningStateIdentity = buildPlanningStateIdentity(
      capture.input,
    );
  }
  return f;
}

beforeEach(resetResidentPlanPortfolioMemory);

describe("pairing 561 native Trace payment and installed-source memory", () => {
  it("finishes the original operation Trace through bank activation and the same rules choice", () => {
    const f = fixture();
    expect(f.originalPrefixProof).toMatchObject({
      checkedStates: 20,
      originalAppliedPrefix: 19,
    });
    let state = f.engineBeforeBid;
    expect(hashGameState(state)).toBe(f.bid.stateHash);
    const snapshot = f.bid.input.ownDeckSnapshot!;
    restoreAiRuntimeCheckpoint(
      f.bid.input,
      snapshot.deckSnapshotId,
      f.bid.runtime,
    );
    const actions: string[] = [];
    let lastInput = f.bid.input;
    for (let step = 0; step < 3; step++) {
      const input =
        step === 0
          ? f.bid.input
          : step === 1
            ? f.payment.input
            : buildAiDecisionInput(state, "runner", {
                difficulty: "hard",
                profileId: f.bid.input.profileId,
                ownDeckSnapshot: snapshot,
              });
      lastInput = input;
      const before = JSON.stringify(input);
      const decision = chooseAiAction(input);
      if (!decision.actionId)
        throw Error("Expected a direct current Trace action");
      expect(JSON.stringify(input)).toBe(before);
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.timeoutUsed).toBe(false);
      expect(
        input.legalActions.some((a) => a.actionId === decision.actionId),
      ).toBe(true);
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        lane: "engine_window",
        rootPlanInstanceId: "rules",
        leafExecutorInstanceId: "rules.window_resolution",
      });
      actions.push(decision.actionId);
      if (step === 0)
        expect(decision.selectedChoices?.selectedOptionIds).toEqual(["bid_7"]);
      const applied = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: decision.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(decision.selectedChoices
          ? { selectedChoices: decision.selectedChoices }
          : {}),
      });
      expect(applied.ok).toBe(true);
      if (!applied.ok) throw Error(applied.error.message);
      state = applied.state;
      if (step === 0) expect(hashGameState(state)).toBe(f.payment.stateHash);
      if (step === 1) expect(state.runner.credits).toBe(9);
    }
    expect(actions[0]).toBe("runner.resolve_choice");
    expect(actions[1]).toContain("pay_three_trash_source_gain_six");
    expect(actions[2]).toBe(actions[0]);
    expect(state.runner.credits).toBe(2);
    expect(state.runner.tags).toBe(0);
    expect(state.trace).toBeUndefined();
    expect(
      residentPlanPortfolioSnapshot(lastInput)
        ?.pendingRunnerCostPenaltySupportOrigin,
    ).toBeUndefined();
  });

  it("does not invent the missing original rule origin in the old failed checkpoint", () => {
    const { payment } = fixture();
    restoreAiRuntimeCheckpoint(
      payment.input,
      payment.input.ownDeckSnapshot!.deckSnapshotId,
      payment.runtime,
    );
    expect(() => chooseAiAction(payment.input)).toThrow(
      expect.objectContaining({ code: "missing_plan_module_coverage" }),
    );
  });

  it.each([
    "other_trace",
    "other_owner",
    "other_side",
    "other_timing",
    "stale_choice",
    "other_option",
  ])("does not bind an unrelated mandatory window: %s", (variant) => {
    const { bid } = fixture();
    const input = bid.input;
    const result: Extract<PlanSchedulerResult, { lane: "engine_window" }> = {
      lane: "engine_window",
      actionId: "runner.resolve_choice",
      origin: {
        rootPlanInstanceId: "rules",
        leafPlanInstanceId: "rules.window_resolution",
        side: "runner",
        windowKind: "mandatory_choice",
        windowId: "corp_action.main:19",
        stateVersion: 19,
        timingPoint: "corp_action.main",
      },
      portfolio: structuredClone(bid.runtime.residentPlanPortfolio!),
      diagnostics: [],
    };
    if (variant === "other_trace")
      input.playerView.pendingChoice!.source = "trace:other";
    if (variant === "other_owner") result.origin.rootPlanInstanceId = "other";
    if (variant === "other_side") result.origin.side = "corp";
    if (variant === "other_timing")
      input.legalActions[0]!.timingPoint = "runner_action.main";
    if (variant === "stale_choice")
      input.playerView.pendingChoice!.stateVersion--;
    if (variant === "other_option")
      input.legalActions[0]!.choiceRequirements![0]!.optionIds[0] = "foreign";
    reconcileSelectedRunnerCostPenaltySupportOrigin(
      input,
      result,
      bid.runtime.residentPlanPortfolio,
    );
    expect(
      result.portfolio?.pendingRunnerCostPenaltySupportOrigin,
    ).toBeUndefined();
    expect(result.portfolio?.stateVersion).toBe(15);
  });

  it("removes both exact and positional memory of a publicly self-trashed source, preserving its sibling ICE", () => {
    const { remote } = fixture();
    const input = remote.input;
    const before = JSON.stringify(input);
    const belief = reconstructBeliefState(input);
    const memory = belief.knownPositionMemory!.filter(
      (m) => m.zone === "remote_1",
    );
    expect(
      memory.some(
        (m) => m.definitionId === "onr_v1_309_bbs-whispering-campaign",
      ),
    ).toBe(false);
    expect(memory.some((m) => m.definitionId === "onr_v1_244_filter")).toBe(
      true,
    );
    const target = evaluateRunnerRunTargets({
      input,
      beliefState: belief,
    }).find((t) => t.targetServerId === "remote_1")!;
    expect(target.accessFacts.knownTargetDefinitionIds).toEqual([]);
    expect(target.accessPayoff).toBe("score_threat");
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      remote.runtime,
    );
    const decision = chooseAiAction(input);
    // Correct facts do not remove the independent unknown-ICE hand reserve.
    expect(decision.actionId).toBe("runner.draw_card");
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.defense_and_recovery");
    expect(decision.fallbackUsed).toBe(false);
    expect(JSON.stringify(input)).toBe(before);
  });
});
