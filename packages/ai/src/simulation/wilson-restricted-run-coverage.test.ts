import { describe, expect, it } from "vitest";

import {
  listMatchProgressionBenchmarkDeckSlots,
  simulateAiGame,
} from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

describe("Wilson Weeflerunner Engine-restricted run coverage", () => {
  it("keeps the exact Fast Advance seed-02 run grant plan-owned", () => {
    const slot = listMatchProgressionBenchmarkDeckSlots().find(
      (candidate) =>
        candidate.slotId === "strategy_panel_fast_advance_chrome_rush",
    );
    if (!slot) throw new Error("Missing Fast Advance benchmark slot.");
    const resolved = resolveBenchmarkDeckSlot(slot);
    if (!resolved.ok) throw new Error(resolved.reason);
    const captures: AiSimulationDecisionCheckpointCapture[] = [];

    const summary = simulateAiGame({
      seed: "ai-behavior-baseline-v1-02",
      maxActions: 15,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      ...resolved.config,
      testOnlyDecisionCheckpointCapture: {
        actionIndices: Array.from({ length: 15 }, (_, index) => index),
        capture: (snapshot) => {
          captures.push(snapshot);
        },
      },
    });

    const wilsonSource = "runner_onr_v1_187_wilson-weeflerunner-apprentice_1";
    const capture = captures.find((snapshot) => {
      const startRuns = snapshot.input.legalActions.filter(
        (action) => action.type === "start_run",
      );
      return (
        startRuns.length > 0 &&
        startRuns.every((action) => action.source === wilsonSource)
      );
    });
    expect(capture).toBeDefined();
    if (!capture) throw new Error("Missing Wilson restricted-run capture.");
    expect(capture.input.playerView.own).toMatchObject({
      clicks: 0,
      credits: 4,
    });
    const wilsonRuns = capture.input.legalActions.filter(
      (action) => action.type === "start_run" && action.source === wilsonSource,
    );
    expect(wilsonRuns).toHaveLength(3);
    expect(
      wilsonRuns.map((action) => ({
        serverId: action.payload?.serverId,
        restriction: action.payload?.actionCapacityRestriction,
        allowedAction: action.payload?.restrictedActionGrantActionType,
        costProfile: action.payload?.restrictedActionGrantCostProfile,
        remaining: action.payload?.restrictedActionGrantRemainingActions,
      })),
    ).toEqual([
      {
        serverId: "hq",
        restriction: "run_only",
        allowedAction: "start_run",
        costProfile: "extra_click",
        remaining: 1,
      },
      {
        serverId: "rd",
        restriction: "run_only",
        allowedAction: "start_run",
        costProfile: "extra_click",
        remaining: 1,
      },
      {
        serverId: "archives",
        restriction: "run_only",
        allowedAction: "start_run",
        costProfile: "extra_click",
        remaining: 1,
      },
    ]);
    expect(
      capture.input.playerView.publicEvents.slice(-2).map((event) => ({
        type: event.type,
        actor: event.publicPayload?.actor,
        actionType: event.publicPayload?.actionType,
        cardDefinitionId: event.publicPayload?.cardDefinitionId,
      })),
    ).toEqual([
      {
        type: "play_event",
        actor: "runner",
        actionType: "play_event",
        cardDefinitionId: "onr_v1_097_livewires-contacts",
      },
      {
        type: "install_card",
        actor: "runner",
        actionType: "install_card",
        cardDefinitionId: "onr_v1_187_wilson-weeflerunner-apprentice",
      },
    ]);

    expect(summary.terminationKind).toBe("action_limit");
    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(
      summary.actionSequence.find((entry) =>
        entry.evidence.includes(
          "plan_assessment_evidence:runner_engine_restricted_run_sequence_continuation",
        ),
      ),
    ).toMatchObject({
      side: "runner",
      actionType: "start_run",
      targetServerId: "archives",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      evidence: expect.arrayContaining([
        "plan_assessment_evidence:runner_engine_restricted_run_sequence_continuation",
        `plan_first_executor:plan:runner.convert_run_window:run%3A${capture.state.stateVersion}`,
      ]),
    });
  });
});
