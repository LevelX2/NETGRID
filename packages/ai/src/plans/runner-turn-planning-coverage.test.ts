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
import { runnerCoverageDispositions } from "./runner-turn-planner-shadow";

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

  it("keeps an unbound installed card run ability with the existing run owner", () => {
    const actionId =
      "runner.activated_card_ability.shredder.archives.make_run";
    const dispositions = runnerCoverageDispositions({
      input: {
        side: "runner",
        playerView: { stateVersion: 73, own: { clicks: 4 } } as never,
        eventTail: [],
        legalActions: [
          {
            actionId,
            type: "activated_card_ability",
            side: "runner",
            stateVersion: 73,
            timingPoint: "runner_action.main",
            payload: {
              cardImplementationEffectKind: "make_run",
              runServerId: "archives",
              accessServerId: "hq",
            },
          } as never,
        ],
        difficulty: "hard",
        seed: "runner-card-run-coverage",
        decisionId: "runner-card-run-coverage:runner:1",
        actionNumber: 1,
        profileId: "runner-card-run-coverage-test",
      },
      existing: [],
      candidates: [
        {
          actionId,
          actionType: "activated_card_ability",
          semanticActionType: "card_ability.activate",
          effectTargets: ["make_run"],
        } as never,
      ],
      coveredActionIds: new Set(),
    });

    expect(dispositions).toEqual([
      expect.objectContaining({
        actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.pressure_central",
        evidenceCode:
          "runner_card_run_ability_has_no_current_bound_route:hq",
      }),
    ]);
  });
});
