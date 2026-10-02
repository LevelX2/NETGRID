import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import * as coverageModule from "../../runner/rig-coverage/coverage-plan-module";
import type { PlanSchedulerContext } from "../../plans/plan-scheduler";
import type { RunnerPlanDomain } from "../../plans/runner-tactical-plan-contracts";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(() => {
  resetResidentPlanPortfolioMemory();
  vi.restoreAllMocks();
});

it.each([
  ["r2-g1-d304", "development keeps a different unbound answer"],
  ["r2-g29-d157", "coverage defers a rejected remote payoff"],
])("native %s: %s", (name) => {
  const fixture = JSON.parse(
    readFileSync(
      new URL(`fixtures/meta490-${name}.json`, import.meta.url),
      "utf8",
    ),
  );
  expect(Object.keys(fixture.validation)).toHaveLength(9);
  expect(
    Object.values(fixture.validation).every((value) => value === true),
  ).toBe(true);
  const input = {
    ...fixture.input,
    ...buildAiDecisionInputDto(fixture.input),
  } as AiDecisionInput;
  restoreAiRuntimeCheckpoint(
    input,
    fixture.input.ownDeckSnapshot.deckSnapshotId,
    fixture.runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    structuredClone(fixture.runtime.residentPlanPortfolio),
  );
  const original = coverageModule.createRunnerCoverageModule;
  let observed: PlanSchedulerContext | undefined;
  vi.spyOn(coverageModule, "createRunnerCoverageModule").mockImplementation(
    (roles) => {
      const module = original(roles);
      return {
        ...module,
        discover(context) {
          observed = context;
          return module.discover(context);
        },
      };
    },
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(
    input.legalActions.some((action) => action.actionId === decision.actionId),
  ).toBe(true);
  expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: decision.actionId,
    stateVersion: input.playerView.stateVersion,
  });
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const executor = portfolio.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  )!;
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toBe(executor.instanceId);
  expect(executor.moduleId).toMatch(/^runner\./);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedStep?.stepId,
  ).toBeTruthy();
  const domain = observed!.domain as RunnerPlanDomain;
  if (name === "r2-g1-d304") {
    const gap = domain.coverageGaps.find(
      (gap) => gap.requiredRole === "breaker_wall",
    )!;
    expect(gap.handAnswerDefinitionId).toBe("onr_v1_074_worm");
    expect(
      gap.installActionIds?.every((action) => action.includes("worm")),
    ).toBe(true);
    const dwarf = domain.developments.find(
      (signal) => signal.definitionId === "onr_v1_021_dwarf",
    )!;
    expect(dwarf.assignedDomainPlanIds).toEqual([]);
    expect(dwarf.actionIds.some((action) => action.includes("dwarf"))).toBe(
      true,
    );
  } else {
    const gap = domain.coverageGaps.find(
      (gap) => gap.requesterModuleId === "runner.contest_remote",
    )!;
    const parent = domain.remoteContests.find(
      (parent) => parent.supportNeedId === gap.gapId,
    )!;
    expect(parent.marginalValue).toBe(0);
    expect(parent.evidenceCode).toContain(
      "runner_known_access_damage_ambush_requires_jack_out",
    );
    expect(gap.handAnswerDefinitionId).toBe("onr_v1_021_dwarf");
    for (const actionId of gap.installActionIds!) {
      expect(observed!.actionDispositions).toContainEqual({
        actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.rig_and_coverage",
        evidenceCode:
          "runner_coverage_install_deferred_by_nonpositive_bound_parent",
      });
    }
    expect(gap.installActionIds).not.toContain(decision.actionId);
  }
});
