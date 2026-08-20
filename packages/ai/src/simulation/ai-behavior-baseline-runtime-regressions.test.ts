import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  listMatchProgressionBenchmarkDeckSlots,
  simulateAiGame,
} from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

describe("AI behavior baseline runtime regressions", () => {
  it("keeps a card development route bound to the exact visible card action", () => {
    const result = runCapturedSeed(
      "strategy_panel_fast_advance_chrome_rush",
      "ai-behavior-baseline-v1-01",
      49,
    );

    expect(
      result.summary.errors,
      JSON.stringify(captureDiagnostic(result.capture), undefined, 2),
    ).toEqual([]);
  });

  it("does not spend usable recurring-economy hold capacity on EndTurn", () => {
    const result = runCapturedSeed(
      "strategy_panel_fast_advance_chrome_rush",
      "ai-behavior-baseline-v1-05",
      10,
    );

    expect(
      result.summary.errors,
      JSON.stringify(captureDiagnostic(result.capture), undefined, 2),
    ).toEqual([]);
  });

  it("reaches the final deterministic fast-advance checkpoint without runtime errors", () => {
    const result = runCapturedSeed(
      "strategy_panel_fast_advance_chrome_rush",
      "ai-behavior-baseline-v1-04",
      191,
    );

    expect(
      result.summary.errors,
      JSON.stringify(captureDiagnostic(result.capture), undefined, 2),
    ).toEqual([]);
  }, 20_000);

  it("preserves the owner of an unforced Runner choice window", () => {
    const result = runCapturedSeed(
      "strategy_panel_fast_advance_chrome_rush",
      "ai-behavior-baseline-v1-08",
      106,
    );

    expect(
      result.summary.errors,
      JSON.stringify(captureDiagnostic(result.capture), undefined, 2),
    ).toEqual([]);
  });

  it("keeps strategic-exchange funding out of generic liquidity routes", () => {
    const result = runCapturedSeed(
      "strategy_panel_fast_advance_chrome_rush",
      "ai-behavior-baseline-v1-01",
      239,
    );

    expect(
      result.summary.errors,
      JSON.stringify(captureDiagnostic(result.capture), undefined, 2),
    ).toEqual([]);
  }, 20_000);

  it("leaves parent-bound strategic-exchange funding exclusively with its parent route", () => {
    const result = runCapturedSeed(
      "strategy_panel_hybrid_score_punish_cheap_bag",
      "ai-behavior-baseline-v1-01",
      46,
    );

    expect(
      result.summary.errors,
      JSON.stringify(captureDiagnostic(result.capture), undefined, 2),
    ).toEqual([]);
  });

  it("reaches the final deterministic hybrid checkpoint without runtime errors", () => {
    const result = runCapturedSeed(
      "strategy_panel_hybrid_score_punish_cheap_bag",
      "ai-behavior-baseline-v1-08",
      184,
    );

    expect(
      result.summary.errors,
      JSON.stringify(captureDiagnostic(result.capture), undefined, 2),
    ).toEqual([]);
  }, 20_000);
});

function runCapturedSeed(slotId: string, seed: string, actionIndex: number) {
  const slot = listMatchProgressionBenchmarkDeckSlots().find(
    (candidate) => candidate.slotId === slotId,
  );
  if (!slot) throw new Error(`Missing benchmark slot ${slotId}.`);
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
      `Missing ${slotId}/${seed} checkpoint at action ${actionIndex}.`,
    );
  }
  return { summary, capture };
}

function captureDiagnostic(capture: AiSimulationDecisionCheckpointCapture) {
  return {
    side: capture.side,
    stateVersion: capture.state.stateVersion,
    timingPoint: capture.state.timingPoint,
    clicks: capture.input.playerView.own.clicks,
    credits: capture.input.playerView.own.credits,
    pendingChoice: capture.input.playerView.pendingChoice,
    ownGrip: capture.input.playerView.own.gripOrHq.map((card) => ({
      instanceId: card.instanceId,
      definitionId: card.definitionId,
      type: card.type,
    })),
    legalActions: capture.input.legalActions.map((action) => ({
      actionId: action.actionId,
      type: action.type,
      source: action.source,
      payload: action.payload,
    })),
    candidates: buildActionSemanticCandidates(capture.input).map(
      (candidate) => ({
        actionId: candidate.actionId,
        actionType: candidate.actionType,
        semanticActionType: candidate.semanticActionType,
        sourceCardInstanceId: candidate.sourceCardInstanceId,
        sourceDefinitionId: candidate.sourceDefinitionId,
        planOwnerBinding: candidate.planOwnerBinding,
        economyProjection: candidate.economyProjection,
      }),
    ),
  };
}
