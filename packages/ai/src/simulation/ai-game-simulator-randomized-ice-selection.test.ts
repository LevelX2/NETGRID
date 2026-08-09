import { describe, expect, it } from "vitest";
import {
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
  type AiDecision,
} from "@netgrid/shared";

import { chooseAiAction } from "../index";
import { createAiGameSimulator } from "./ai-game-simulator";

describe("AI game simulator randomized ICE-install selection", () => {
  it("binds Punish route quotes to the current simulation state and overrides foreign callbacks", () => {
    let stateBoundQuotes = 0;
    let foreignQuotes = 0;
    const simulator = createAiGameSimulator({
      chooseDecisionForSimulation: (side, input, config): AiDecision => {
        if (
          side === "corp" &&
          stateBoundQuotes === 0 &&
          input.playerView.timingPoint === "corp_action.main"
        ) {
          if (!input.matchId)
            throw new Error(
              "Simulation Punish quote is missing match binding.",
            );
          const quote = config.aiDecisionRuntimeOptions?.quoteCorpPunishRoute?.(
            {
              schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
              matchId: input.matchId,
              side: "corp",
              stateVersion: input.playerView.stateVersion,
              timingPoint: input.playerView.timingPoint,
              campaignId: "test:simulation-state-bound-punish",
              routeId: "test:missing-source-route",
              steps: [
                {
                  stepId: "test:missing-source-step",
                  order: 0,
                  kind: "meat_damage",
                  sourceCardInstanceId: "missing-source",
                  sourceCapabilityBindingKind:
                    "legacy_card_implementation_index",
                  sourceCapabilityId: "ability:on_play:0",
                },
              ],
            },
          );
          expect(quote?.ok).toBe(true);
          if (!quote?.ok)
            throw new Error(
              quote?.error.message ??
                "Simulator did not provide a state-bound Punish quote.",
            );
          expect(quote.quote).toMatchObject({
            matchId: input.matchId,
            stateVersion: input.playerView.stateVersion,
            timingPoint: input.playerView.timingPoint,
            complete: false,
            incompleteReasons: ["source_unavailable"],
          });
          stateBoundQuotes += 1;
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
      seed: "punish-state-bound-callback",
      maxActions: 12,
      aiDecisionRuntimeOptions: {
        quoteCorpPunishRoute: () => {
          foreignQuotes += 1;
          throw new Error("foreign Punish quote callback must be overridden");
        },
      },
    });

    expect(stateBoundQuotes).toBe(1);
    expect(foreignQuotes).toBe(0);
    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(JSON.stringify(summary)).not.toMatch(
      /simulation-state-bound-punish|missing-source-route|requestEcho/,
    );
  });

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
