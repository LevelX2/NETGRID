import { describe, expect, it } from "vitest";
import {
  ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
  type AiDecision,
} from "@netgrid/shared";

import { chooseAiAction } from "../index";
import { createAiGameSimulator } from "./ai-game-simulator";

describe("AI game simulator randomized ICE-install selection", () => {
  it("quotes, applies, traces, and replays the Engine-selected LegalAction", () => {
    let randomizedSelections = 0;
    const simulator = createAiGameSimulator({
      chooseDecisionForSimulation: (_side, input, config): AiDecision => {
        const hqIce = input.legalActions.find(
          (action) =>
            action.type === "install_card" &&
            action.payload?.placement === "ice" &&
            action.payload.serverId === "hq" &&
            typeof action.payload.cardId === "string",
        );
        const rdIce = input.legalActions.find(
          (action) =>
            action.type === "install_card" &&
            action.payload?.placement === "ice" &&
            action.payload.serverId === "rd" &&
            action.payload.cardId === hqIce?.payload?.cardId,
        );
        if (randomizedSelections === 0 && hqIce && rdIce && input.matchId) {
          const quote =
            config.aiDecisionRuntimeOptions?.quoteRandomizedIceInstallSelection?.(
              {
                schemaVersion:
                  ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
                matchId: input.matchId,
                side: "corp",
                stateVersion: input.playerView.stateVersion,
                timingPoint: input.playerView.timingPoint,
                planStepId: "plan:corp.defend_servers:simulation-near-tie-test",
                candidates: [
                  { actionId: hqIce.actionId, targetServerId: "hq" },
                  { actionId: rdIce.actionId, targetServerId: "rd" },
                ],
              },
            );
          if (!quote?.ok) {
            throw new Error(
              quote?.error.message ??
                "Simulator did not provide an Engine quote callback.",
            );
          }
          randomizedSelections += 1;
          return {
            selectionKind: "engine_randomized_ice_install_selection",
            engineCommand: {
              kind: "engine_randomized_ice_install_selection",
              quote: quote.quote,
            },
            reasonCode: "test.simulation_randomized_ice_near_tie",
            explanation:
              "Exercise the simulator's atomic Engine-randomized decision path.",
            consideredActionIds: [hqIce.actionId, rdIce.actionId],
            fallbackUsed: false,
          };
        }
        return chooseAiAction(input, config.aiDecisionRuntimeOptions);
      },
      simulationSideUsesSemanticRuntime: () => true,
      runnerHandUseDiagnosticsForSimulationAction: () => ({}),
      runnerReserveDiagnosticsForSimulationAction: () => ({}),
      runnerCentralPressureDiagnosticsForSimulationAction: () => ({}),
      runnerBreakerCoverageDiagnosticsForSimulationAction: () => ({}),
      runnerEconomySetupDiagnosticsForSimulationAction: () => ({}),
      tagPunishWindowDiagnosticsForSimulationAction: () => ({}),
      corpFutureRunIceDiagnosticsForSimulationAction: () => ({}),
      qualityTagsForAction: () => [],
    });

    const summary = simulator.simulateAiGame({
      seed: "near-0",
      maxActions: 12,
    });

    expect(randomizedSelections).toBe(1);
    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(
      summary.actionSequence.some(
        (entry) =>
          entry.actionType === "install_card" &&
          (entry.targetServerId === "hq" || entry.targetServerId === "rd"),
      ),
    ).toBe(true);
  });
});
