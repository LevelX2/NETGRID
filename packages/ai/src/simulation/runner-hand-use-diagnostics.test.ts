import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  createRunnerHandUseDiagnosticsForSimulationAction,
  type RunnerHandUseDiagnosticsDependencies,
} from "./runner-hand-use-diagnostics";

describe("runner hand use diagnostics", () => {
  it("matches discarded installable breaker roles by bounded prefixes", () => {
    expect(discardDiagnosticsForRoles(["breaker_fracter"])).toMatchObject({
      runnerDiscardChoice: true,
      runnerDiscardedInstallableBreaker: true,
    });
    const substringNoise = discardDiagnosticsForRoles(["breakerish_fracter"]);
    expect(substringNoise).toMatchObject({ runnerDiscardChoice: true });
    expect(substringNoise).not.toHaveProperty(
      "runnerDiscardedInstallableBreaker",
    );
    const supportPrefix = discardDiagnosticsForRoles(["support_breaker_fracter"]);
    expect(supportPrefix).toMatchObject({ runnerDiscardChoice: true });
    expect(supportPrefix).not.toHaveProperty(
      "runnerDiscardedInstallableBreaker",
    );
  });
});

function discardDiagnosticsForRoles(discardRoles: string[]) {
  const diagnostics = createRunnerHandUseDiagnosticsForSimulationAction(
    dependencies(discardRoles),
  );
  return diagnostics(input(), {} as AiDecision, action(), undefined);
}

function dependencies(discardRoles: string[]): RunnerHandUseDiagnosticsDependencies {
  return {
    runnerDrawKindForSimulationAction: () => ({}),
    hasRunnerPlayableEconomyAction: () => false,
    hasRunnerInstallableBreakerAction: () => false,
    hasRunnerRunnablePressureAction: () => false,
    hasRunnerRemoteTrashAction: () => false,
    runnerDiscardChoiceRoles: () => discardRoles,
    isRunnerDuplicateInstall: () => false,
    isRunnerLowValueDuplicateInstall: () => false,
    isRunnerEconomyAction: () => false,
    isRunnerRigInstallAction: () => false,
    isRunnerPressureAction: () => false,
    sourceDefinitionIdForSimulationAction: () => undefined,
    runnerRemoteTrashAccessContext: () => ({
      trashCost: 0,
      legalTrashActionCount: 0,
      corpValueRemaining: 0,
      creditsAfterGeneralTrash: 0,
      dedicatedTrashCredits: 0,
      generalCreditCost: 0,
    }),
    runnerAdvancedRemoteContestContext: () => ({}),
  };
}

function input(): AiDecisionInput {
  return { side: "runner" } as AiDecisionInput;
}

function action(): LegalAction {
  return {
    actionId: "discard",
    side: "runner",
    type: "resolve_choice",
    label: "Discard",
    source: "game_rule",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
