import type { AiDecisionInput } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import { reconcileResidentPlanPortfolio } from "./resident-plan-portfolio";
import {
  rememberResidentPlanPortfolio,
  residentPlanPortfolioSnapshot,
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "./resident-plan-portfolio-memory";

function input(stateVersion: number): AiDecisionInput {
  return {
    side: "runner",
    profileId: "runner-ai-v0.9-normal",
    decisionId: "binding-test:decision",
    seed: "binding-test",
    playerView: {
      side: "runner",
      winner: null,
      stateVersion,
      timingPoint: "run.encounter_ice",
    },
    legalActions: [],
  } as unknown as AiDecisionInput;
}
function portfolio(stateVersion: number) {
  return reconcileResidentPlanPortfolio({
    side: "runner",
    stateVersion,
    timingPoint: "run.encounter_ice",
    proposals: [],
  });
}
describe("resident portfolio binding diagnostics", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it("retains the rejected version binding after deleting a future cached portfolio", () => {
    rememberResidentPlanPortfolio(input(150), portfolio(150));
    let failure: PlanResolutionFailure | undefined;
    try {
      residentPlanPortfolioSnapshot(input(142));
    } catch (error) {
      if (!(error instanceof PlanResolutionFailure)) throw error;
      failure = error;
    }
    expect(failure).toMatchObject({
      code: "invalid_plan_identity",
      context: {
        portfolioBinding: {
          schemaVersion: "resident-portfolio-binding-failure-v1",
          operation: "read",
          expected: { side: "runner", stateVersion: 142, relation: "at_most" },
          actual: { side: "runner", stateVersion: 150 },
          violations: ["future_state_version"],
        },
      },
    });
    expect(residentPlanPortfolioSnapshot(input(142))).toBeUndefined();
    expect(failure?.message).not.toContain("portfolioBinding");
    expect(failure?.context.portfolioBinding).not.toHaveProperty("instances");
  });
  it("distinguishes wrong-side and schema failures from a stale write", () => {
    const malformed = {
      ...portfolio(142),
      schemaVersion: "invalid-schema",
      side: "corp",
    };
    expect(() =>
      restoreResidentPlanPortfolioMemorySnapshot(
        input(142),
        malformed as never,
      ),
    ).toThrow(
      expect.objectContaining({
        context: expect.objectContaining({
          portfolioBinding: expect.objectContaining({
            operation: "restore",
            actual: {
              schemaVersion: "invalid-schema",
              side: "corp",
              stateVersion: 142,
            },
            violations: ["schema_version_mismatch", "side_mismatch"],
          }),
        }),
      }),
    );
    expect(() =>
      rememberResidentPlanPortfolio(input(142), portfolio(141)),
    ).toThrow(
      expect.objectContaining({
        context: expect.objectContaining({
          portfolioBinding: expect.objectContaining({
            operation: "remember",
            violations: ["stale_state_version"],
          }),
        }),
      }),
    );
  });
});
