import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  listMatchProgressionBenchmarkDeckSlots,
  simulateAiGame,
} from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

const SLOT_ID = "strategy_panel_net_damage_black_ice";

describe("turn-planner shadow behavior-baseline regressions", () => {
  it("keeps Top Runners' Conference install plan-owned at the captured opening state", () => {
    const { summary, capture } = runCapturedSeed(
      "ai-behavior-baseline-v1-05",
      8,
    );
    const actionId =
      "runner.install_card.runner_onr_v1_184_top-runners-conference_2.runner_onr_v1_184_top-runners-conference_2";
    const diagnostic = captureDiagnostic(capture, actionId);

    expect(capture.side).toBe("runner");
    expect(capture.state.stateVersion).toBe(8);
    expect(
      capture.input.legalActions.some((action) => action.actionId === actionId),
      JSON.stringify(diagnostic, undefined, 2),
    ).toBe(true);
    expect(summary.errors, JSON.stringify(diagnostic, undefined, 2)).toEqual(
      [],
    );
  });

  it("keeps the exact Paris City Grid trace-support install plan-owned", () => {
    const { summary, capture } = runCapturedSeed(
      "ai-behavior-baseline-v1-08",
      159,
    );
    const actionId =
      "corp.install_card.corp_onr_v1_365_paris-city-grid_1.remote_1.corp_onr_v1_365_paris-city-grid_1";
    const diagnostic = captureDiagnostic(capture, actionId);

    expect(capture.side).toBe("corp");
    expect(capture.state.stateVersion).toBe(159);
    expect(
      capture.input.legalActions.some((action) => action.actionId === actionId),
      JSON.stringify(diagnostic, undefined, 2),
    ).toBe(true);
    expect(summary.errors, JSON.stringify(diagnostic, undefined, 2)).toEqual(
      [],
    );
  });
});

function runCapturedSeed(seed: string, actionIndex: number) {
  const slot = listMatchProgressionBenchmarkDeckSlots().find(
    (candidate) => candidate.slotId === SLOT_ID,
  );
  if (!slot) throw new Error(`Missing benchmark slot ${SLOT_ID}.`);
  const resolved = resolveBenchmarkDeckSlot(slot);
  if (!resolved.ok) throw new Error(resolved.reason);
  let capture: AiSimulationDecisionCheckpointCapture | undefined;
  const summary = simulateAiGame({
    seed,
    maxActions: actionIndex + 1,
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    ...resolved.config,
    testOnlyDecisionCheckpointCapture: {
      actionIndices: [actionIndex],
      capture: (snapshot) => {
        capture = snapshot;
      },
    },
  });
  if (!capture) {
    throw new Error(
      `Missing ${SLOT_ID}/${seed} checkpoint at action ${actionIndex}.`,
    );
  }
  return { summary, capture };
}

function captureDiagnostic(
  capture: AiSimulationDecisionCheckpointCapture,
  actionId: string,
) {
  return {
    side: capture.side,
    stateVersion: capture.state.stateVersion,
    action: capture.input.legalActions.find(
      (candidate) => candidate.actionId === actionId,
    ),
    candidate: buildActionSemanticCandidates(capture.input).find(
      (candidate) => candidate.actionId === actionId,
    ),
  };
}
