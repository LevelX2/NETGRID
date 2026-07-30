import { describe, expect, it } from "vitest";

import { createRunnerCorePlanModules } from "./runner-core-plan-modules";
import { createRunnerTacticalPlanModules } from "./runner-tactical-plan-modules";
import {
  assertRunnerTurnPlanningModuleRegistry,
  buildRunnerTurnPlanningCoverageReport,
  RUNNER_TURN_PLANNING_MODULE_COVERAGE,
} from "./runner-turn-planning-coverage";
import { createTurnCompletionPlanModule } from "./turn-completion-plan-module";
import type { PlanningStateIdentity } from "./turn-planning-contracts";

describe("Runner turn planning coverage", () => {
  it("binds every Runner module to an explicit horizon and vertical slice", () => {
    const registered = [
      ...createRunnerCorePlanModules(),
      ...createRunnerTacticalPlanModules(),
      createTurnCompletionPlanModule("runner"),
    ].map((module) => module.moduleId);

    expect(() =>
      assertRunnerTurnPlanningModuleRegistry(registered),
    ).not.toThrow();
    expect(
      RUNNER_TURN_PLANNING_MODULE_COVERAGE.map(
        (entry) => entry.moduleId,
      ).sort(),
    ).toEqual([...registered].sort());
    expect(
      RUNNER_TURN_PLANNING_MODULE_COVERAGE.map((entry) => entry.ownerKind),
    ).toEqual(
      expect.arrayContaining([
        "economy",
        "breaker",
        "development",
        "run",
        "multiaccess",
      ]),
    );
    expect(
      RUNNER_TURN_PLANNING_MODULE_COVERAGE.some((entry) =>
        entry.semanticActionPatterns.includes("*"),
      ),
    ).toBe(false);
  });

  it("accepts an empty current Runner action set as completely classified", () => {
    const stateIdentity: PlanningStateIdentity = {
      stateVersion: 7,
      sideSafePlanningFingerprint: "fnv1a:runner-empty",
    };
    const report = buildRunnerTurnPlanningCoverageReport({
      input: {
        side: "runner",
        playerView: {
          stateVersion: 7,
          own: { clicks: 0 },
        } as never,
        legalActions: [],
      },
      stateIdentity,
      candidates: [],
      heads: [],
      dispositions: [],
      engineWindowActionIds: [],
    });

    expect(report).toMatchObject({
      schemaVersion: "runner-turn-planning-coverage-v1",
      status: "pass",
      coveragePercent: 100,
      legalActionCount: 0,
      classifiedActionCount: 0,
      missingActionCount: 0,
      conflictingActionCount: 0,
      issues: [],
    });
  });
});
