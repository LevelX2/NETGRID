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

  it("keeps score-remote defense preparation clean under conservative uncertainty", () => {
    const summary = runSeedSummary("ai-behavior-baseline-v1-08", 160);
    const agendaInstallIndex = summary.actionSequence.findIndex(
      (entry) =>
        entry.side === "corp" &&
        entry.actionType === "install_card" &&
        entry.targetCardType === "agenda" &&
        entry.targetServerId?.startsWith("remote_") === true,
    );
    const agendaServerId =
      summary.actionSequence[agendaInstallIndex]?.targetServerId;
    const protectedRemoteIceInstallIndex = summary.actionSequence.findIndex(
      (entry, index) =>
        (agendaInstallIndex < 0 || index < agendaInstallIndex) &&
        entry.side === "corp" &&
        entry.actionType === "install_card" &&
        entry.targetCardType === "ice" &&
        (agendaInstallIndex < 0 ||
          entry.targetServerId === agendaServerId ||
          entry.targetServerId === "new_remote") &&
        entry.planKind === "corp.defend_servers",
    );
    const corpActionDiagnostic = JSON.stringify(
      summary.actionSequence
        .filter(
          (entry) =>
            entry.side === "corp" && (entry.actionsRemainingBefore ?? 0) > 0,
        )
        .map((entry) => ({
          stateVersionBefore: entry.stateVersionBefore,
          turnNumber: entry.turnNumber,
          actionsRemainingBefore: entry.actionsRemainingBefore,
          actionType: entry.actionType,
          planKind: entry.planKind,
          targetServerId: entry.targetServerId,
          targetCardType: entry.targetCardType,
        })),
      undefined,
      2,
    );

    expect(summary.errors).toEqual([]);
    expect(["action_limit", "game_result"]).toContain(summary.terminationKind);
    expect(summary.actions).toBeGreaterThan(0);
    expect(summary.actions).toBeLessThanOrEqual(160);
    expect(
      protectedRemoteIceInstallIndex,
      corpActionDiagnostic,
    ).toBeGreaterThanOrEqual(0);
    if (agendaInstallIndex >= 0) {
      expect(agendaInstallIndex).toBeGreaterThan(
        protectedRemoteIceInstallIndex,
      );
    }
  }, 15_000);
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
    aiDecisionRuntimeOptions: {
      corpTurnPlannerMode: "legacy_compare",
      runnerTurnPlannerMode: "legacy_compare",
    },
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

function runSeedSummary(seed: string, maxActions: number) {
  const slot = listMatchProgressionBenchmarkDeckSlots().find(
    (candidate) => candidate.slotId === SLOT_ID,
  );
  if (!slot) throw new Error(`Missing benchmark slot ${SLOT_ID}.`);
  const resolved = resolveBenchmarkDeckSlot(slot);
  if (!resolved.ok) throw new Error(resolved.reason);
  return simulateAiGame({
    seed,
    maxActions,
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    ...resolved.config,
    aiDecisionRuntimeOptions: {
      corpTurnPlannerMode: "legacy_compare",
      runnerTurnPlannerMode: "legacy_compare",
    },
  });
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
