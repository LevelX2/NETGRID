import type { AiDecision } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { actionCapacityDiagnosticsForSimulationDecision } from "./action-capacity-simulation-diagnostics";

describe("action-capacity simulation diagnostics", () => {
  it("counts legal sources, selected plan conversion, and dominated alternatives", () => {
    const diagnostics = actionCapacityDiagnosticsForSimulationDecision({
      decisionDebug: {
        actionAlternatives: [
          {
            rank: 1,
            actionId: "overtime",
            actionType: "play_operation",
            selected: true,
            scoreBreakdown: [
              {
                key: "action_capacity_plan_conversion",
                label: "Planfolge",
                value: 720,
              },
            ],
          },
          {
            rank: 2,
            actionId: "plus-one",
            actionType: "trigger_ability",
            selected: false,
            scoreBreakdown: [
              {
                key: "action_capacity_followup_conversion",
                label: "Folgeaktion",
                value: 120,
              },
            ],
            whyNot: [
              "action_capacity_dominant:overtime|action_capacity_dominated:plus-one",
            ],
          },
        ],
      },
    } as unknown as AiDecision);

    expect(diagnostics).toEqual({
      actionCapacityOpportunity: true,
      actionCapacityLegalSourceCount: 2,
      actionCapacitySourceUsed: true,
      actionCapacityPlanConversionUsed: true,
      actionCapacityDominatedAlternativeCount: 1,
    });
  });

  it("emits no action-capacity flags for ordinary decisions", () => {
    expect(
      actionCapacityDiagnosticsForSimulationDecision({
        decisionDebug: { actionAlternatives: [] },
      } as unknown as AiDecision),
    ).toEqual({});
  });
});
