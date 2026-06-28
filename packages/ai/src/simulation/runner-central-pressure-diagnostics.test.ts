import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { createRunnerCentralPressureDiagnosticsForSimulationAction } from "./runner-central-pressure-diagnostics";

describe("runner central pressure diagnostics", () => {
  it("matches installed multiaccess roles by bounded role terms", () => {
    expect(diagnosticsForRoles(["interface_multiaccess"])).toMatchObject({
      runnerCentralRunWithMultiaccess: true,
    });
    expect(diagnosticsForRoles(["multiaccessory_noise"])).not.toHaveProperty(
      "runnerCentralRunWithMultiaccess",
    );
  });
});

function diagnosticsForRoles(roles: string[]) {
  const diagnostics = createRunnerCentralPressureDiagnosticsForSimulationAction(
    {
      rolesForCardId: () => roles,
      sourceDefinitionIdForSimulationAction: () => undefined,
      bestTrueCentralCloseoutProfileForMetrics: () => ({
        opportunity: false,
        reasons: [],
      }),
      trueCentralCloseoutProfileForMetrics: () => ({
        opportunity: false,
        reasons: [],
      }),
      runnerNoFreshCentralContextForMetrics: () => ({
        targets: [],
        betterAlternatives: [],
        allowedReasons: [],
      }),
      noFreshCentralSubstitutionTypeForAction: () => undefined,
      runnerCreditReserveTargetForInput: () => 0,
      assessKnownRezzedIcePath: () =>
        ({ blocked: false, visibleBreakCost: 0 }) as never,
    },
  );
  return diagnostics(input(), startRun(), "rd");
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    eventTail: [],
    legalActions: [],
    playerView: {
      activeSide: "runner",
      phase: "runner_action_phase",
      publicEvents: [],
      agendaPointsToWin: 7,
      own: {
        agendaPoints: 0,
        credits: 5,
        gripOrHq: [],
        rig: [card("rig_card")],
      },
      opponent: {
        handCount: 0,
      },
      servers: [
        {
          id: "rd",
          ice: [],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function startRun(): LegalAction {
  return {
    actionId: "run_rd",
    side: "runner",
    type: "start_run",
    label: "Run R&D",
    source: "basic_action",
    payload: { serverId: "rd" },
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}

function card(definitionId: string): VisibleCard {
  return {
    instanceId: definitionId,
    definitionId,
    known: true,
  } as VisibleCard;
}
