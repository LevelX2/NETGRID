import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";

const rootId = "plan:runner.pressure_central:central%3Ard";
const windowId = "plan:runner.convert_run_window:run%3Arun_164";
const newTarget = "corp_onr_v1_278_wall-of-ice_1";
const oldTarget = "corp_onr_v1_268_shock-r_1";
const sourceId = "runner_onr_v1_065_smarteye_1";

function loadCheckpoint(): {
  input: AiDecisionInput;
  portfolio: ResidentPlanPortfolio;
} {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-736-r1-g37-d171.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(fixture.validation)).toEqual(Array(9).fill(true));
  return {
    input: { ...fixture.input, ...buildAiDecisionInputDto(fixture.input) },
    portfolio: fixture.runtime.residentPlanPortfolio,
  };
}

describe("SP-469: a later approach window after a declined exposure", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it("hands the later target to the same live run parent", () => {
    const { input, portfolio } = loadCheckpoint();
    expect(portfolio.turnPlanExecutionLease).toMatchObject({
      actionType: "trigger_ability",
      currentBinding: {
        actionId: expect.stringContaining(oldTarget),
        stateVersion: 166,
      },
    });
    restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
    const selected = chooseAiAction(input);
    const decline = input.legalActions.find(
      (action) => action.payload?.approachIceExposeDecision === "decline",
    );
    expect(selected.actionId).toBe(decline?.actionId);
    expect(decline).toMatchObject({
      expiresAtStateVersion: 170,
      payload: { cardId: sourceId, iceId: newTarget },
    });
    expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: rootId,
      leafExecutorInstanceId: `plan:runner.expose_information:ice%3A${newTarget}`,
      executionOrigin: { rootPlanInstanceId: rootId, stateVersion: 170 },
    });
    expect(selected.fallbackUsed).toBe(false);
    expect(selected.timeoutUsed).toBe(false);
  });

  it.each(["lease", "run", "server", "gap", "decline", "parent"] as const)(
    "rejects a continuation with an invalid %s binding",
    (defect) => {
      const { input, portfolio } = loadCheckpoint();
      if (defect === "lease") delete portfolio.turnPlanExecutionLease;
      if (defect === "run") input.playerView.run!.runId = "different-run";
      if (defect === "server") {
        const encounter = input.eventTail.find(
          (event) => event.stateVersionBefore === 168,
        )!;
        encounter.publicPayload.serverId = "hq";
      }
      if (defect === "gap") {
        input.eventTail = input.eventTail.filter(
          (event) => event.stateVersionBefore !== 168,
        );
      }
      if (defect === "decline") {
        const earlier = input.eventTail.find(
          (event) => event.stateVersionBefore === 166,
        )!;
        earlier.publicPayload.hiddenZoneAction = "approach_ice_expose";
      }
      if (defect === "parent") {
        portfolio.instances = portfolio.instances.filter(
          (instance) => instance.instanceId !== windowId,
        );
      }
      restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
      expect(() => chooseAiAction(input)).toThrow(/window_origin_missing/);
    },
  );
});
