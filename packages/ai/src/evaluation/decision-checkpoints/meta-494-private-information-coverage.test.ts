import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import * as coverageModule from "../../runner/rig-coverage/coverage-plan-module";
import type { PlanSchedulerContext } from "../../plans/plan-scheduler";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(() => {
  resetResidentPlanPortfolioMemory();
  vi.restoreAllMocks();
});
it.each([
  [1, 133, "sandbox-dig", "rd"],
  [5, 10, "executive-file-clerk", "hq"],
])(
  "classifies the native G%i D%i information capability at its central owner",
  (game, d, name, server) => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-494-r1-g${game}-d${d}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      structuredClone(cp.runtime.residentPlanPortfolio),
    );
    const before = JSON.stringify([input.playerView, input.legalActions]);
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
    const selected = chooseAiAction(input);
    expect(selected.fallbackUsed).toBe(false);
    expect(input.legalActions).toContainEqual(
      expect.objectContaining({
        actionId: selected.actionId,
        expiresAtStateVersion: input.playerView.stateVersion,
      }),
    );
    expect(selected.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: selected.actionId,
      stateVersion: input.playerView.stateVersion,
    });
    expect(
      selected.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toBeTruthy();
    expect(
      selected.decisionDebug?.planFirstDecision?.selectedStep?.stepId,
    ).toBeTruthy();
    const actions = input.legalActions.filter(
      (a: { type: string; actionId: string }) =>
        a.type === "activated_card_ability" && a.actionId.includes(name),
    );
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions)
      expect(observed!.actionDispositions).toContainEqual({
        actionId: action.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.pressure_central",
        evidenceCode: expect.stringContaining(
          `runner_${server}_information_ability_has_no_bound_pre_run_step:`,
        ),
      });
    expect(JSON.stringify([input.playerView, input.legalActions])).toBe(before);
  },
);
