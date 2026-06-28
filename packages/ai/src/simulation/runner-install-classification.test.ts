import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  hasRunnerInstallableBreakerActionForSimulation,
  isRunnerLowValueDuplicateInstallForSimulation,
  isRunnerRigInstallActionForSimulation,
  runnerDrawKindForSimulationAction,
} from "./runner-install-classification";

describe("runnerDrawKindForSimulationAction", () => {
  it("matches search roles by bounded role terms", () => {
    expect(drawKindForRoles(["program_search"])).toMatchObject({
      draw: true,
      cardEffect: true,
    });
    expect(drawKindForRoles(["research_noise"])).toMatchObject({
      draw: false,
      cardEffect: false,
    });
  });
});

describe("runner install classification", () => {
  it("matches rig-install breaker roles by bounded prefixes", () => {
    expect(rigInstallForRoles(["breaker_fracter"])).toBe(true);
    expect(rigInstallForRoles(["breakerish_fracter"])).toBe(false);
    expect(rigInstallForRoles(["support_breaker_fracter"])).toBe(false);
  });

  it("matches installable breaker actions by bounded prefixes", () => {
    expect(installableBreakerForRoles(["breaker_decoder"])).toBe(true);
    expect(installableBreakerForRoles(["breakerish_decoder"])).toBe(false);
    expect(installableBreakerForRoles(["support_breaker_decoder"])).toBe(false);
  });

  it("matches low-value duplicate breaker roles by bounded prefixes", () => {
    expect(lowValueDuplicateForRoles(["breaker_killer"])).toBe(true);
    expect(lowValueDuplicateForRoles(["breakerish_killer"])).toBe(false);
    expect(lowValueDuplicateForRoles(["support_breaker_killer"])).toBe(false);
  });
});

function drawKindForRoles(roles: string[]) {
  return runnerDrawKindForSimulationAction(
    {
      playerView: {},
    } as AiDecisionInput,
    action(),
    {
      rolesForAction: () => roles,
      isSearchChoice: () => false,
    },
  );
}

function rigInstallForRoles(roles: string[]): boolean {
  return isRunnerRigInstallActionForSimulation({} as AiDecisionInput, action("install_card"), {
    rolesForAction: () => roles,
  });
}

function installableBreakerForRoles(roles: string[]): boolean {
  return hasRunnerInstallableBreakerActionForSimulation(
    { legalActions: [action("install_card")] } as AiDecisionInput,
    undefined,
    {
      rolesForAction: () => roles,
    },
  );
}

function lowValueDuplicateForRoles(roles: string[]): boolean {
  return isRunnerLowValueDuplicateInstallForSimulation(
    {} as AiDecisionInput,
    action("install_card"),
    {
      sourceDefinitionIdForAction: () => "local-card",
      rolesForCardId: () => roles,
    },
  );
}

function action(type: LegalAction["type"] = "trigger_ability"): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type,
    label: "Use action",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
