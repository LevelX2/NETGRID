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
import { completeEncounterBreakerPayment } from "../../runner/run-window/run-window-encounter-payment";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function loadCheckpoint(decision: 169 | 171): {
  input: AiDecisionInput;
  portfolio: ResidentPlanPortfolio;
  runtime: AiRuntimeCheckpointV1;
  deckSnapshotId: string;
} {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-736-r2-g16-d${decision}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(fixture.validation)).toEqual(Array(9).fill(true));
  return {
    input: { ...fixture.input, ...buildAiDecisionInputDto(fixture.input) },
    portfolio: fixture.runtime.residentPlanPortfolio,
    runtime: fixture.runtime,
    deckSnapshotId: fixture.input.ownDeckSnapshot.deckSnapshotId,
  };
}

function updateInformationBudget(
  portfolio: ResidentPlanPortfolio,
  credits: number,
) {
  const root = portfolio.instances.find(
    (instance) => instance.instanceId === portfolio.rootForegroundInstanceId,
  );
  const state = root?.moduleState as
    | { kind: "central_pressure"; signal: { encounterCreditSpendLimit: number } }
    | undefined;
  expect(state?.kind).toBe("central_pressure");
  state!.signal.encounterCreditSpendLimit = credits;
}

describe("SP-859: the information budget prices the complete lock break", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it("does not pay the first credit of an unadmitted four-credit route", () => {
    const { input, portfolio } = loadCheckpoint(169);
    const pump = input.legalActions.find((action) => action.type === "pump_breaker")!;
    const continuation = input.legalActions.find((action) => action.type === "continue_run")!;
    expect(pump.costs).toEqual([{ credits: 1 }]);
    expect(completeEncounterBreakerPayment(input, pump)?.cost).toBe(4);
    expect(continuation.payload?.encounterWillEndRun).toBe(false);
    restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
    const selected = chooseAiAction(input);
    expect(selected.actionId).toBe(continuation.actionId);
    expect(selected.decisionDebug?.planFirstDecision?.dispositions).toContainEqual(
      expect.objectContaining({
        actionId: pump.actionId,
        ownerModuleId: "runner.convert_run_window",
        evidenceCode: "runner_run_window_action_excluded:run_plan_information_budget_exceeded",
      }),
    );
    expect(selected.fallbackUsed).toBe(false);
  });

  it("keeps the genuine pump when its entire quoted break fits", () => {
    const { input, portfolio } = loadCheckpoint(169);
    updateInformationBudget(portfolio, 4);
    restoreResidentPlanPortfolioMemorySnapshot(input, portfolio);
    const selected = chooseAiAction(input);
    expect(selected.actionId).toBe(
      input.legalActions.find((action) => action.type === "pump_breaker")?.actionId,
    );
  });

  it("preserves a directly legal affordable break", () => {
    const { input, portfolio, runtime, deckSnapshotId } = loadCheckpoint(171);
    updateInformationBudget(portfolio, 2);
    restoreAiRuntimeCheckpoint(input, deckSnapshotId, runtime);
    const selected = chooseAiAction(input);
    expect(selected.actionId).toBe(
      input.legalActions.find((action) => action.type === "break_subroutine")?.actionId,
    );
  });
});
