import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  runnerInstallScoreComponents,
  type RunnerInstallScoreDependencies,
} from "./runner-install-score";

describe("runnerInstallScoreComponents", () => {
  it("matches breaker install roles by bounded role terms", () => {
    expect(hasBreakerInstallComponent(["breaker_fracter"])).toBe(true);
    expect(hasBreakerInstallComponent(["support_breaker_fracter"])).toBe(true);
    expect(hasBreakerInstallComponent(["breaker_fracterish_noise"])).toBe(false);
  });
});

function hasBreakerInstallComponent(roles: string[]): boolean {
  return runnerInstallScoreComponents(
    {} as AiDecisionInput,
    { type: "install_card" } as LegalAction,
    { loanInstallAction: false },
    dependencies(roles),
  ).some((component) => component.key === "runner_install_breaker");
}

function dependencies(roles: string[]): RunnerInstallScoreDependencies {
  return {
    rolesForAction: () => roles,
    sourceCard: () => undefined,
    muPressureInstallScoreComponent: () => undefined,
    persistentInstallFitScoreComponent: () => undefined,
    isRunnerEconomyRole: () => false,
    isRunnerPressureRole: () => false,
    badPublicityOrTraceTechCard: () => false,
    programInstallTrashAssessmentForAction: () => undefined,
    programInstallDisplacementPenalty: () => 0,
  };
}
