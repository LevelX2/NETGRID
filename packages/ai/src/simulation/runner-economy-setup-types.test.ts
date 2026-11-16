import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  runnerEconomySetupActionClass,
  runnerEconomySkipReasonForDiagnostics,
  runnerEconomySubcounts,
} from "./runner-economy-setup-types";

describe("runnerEconomySetupActionClass", () => {
  it("matches economy setup roles by bounded role terms", () => {
    const structured = classify([
      "finite_economy_pool",
      "loan_debt",
      "tag_risk",
    ]);

    expect(structured).toMatchObject({
      finitePoolEconomy: true,
      loanDebtEconomy: true,
      downsideEconomy: true,
    });

    const noise = classify([
      "infinite_noise",
      "poolish_noise",
      "loaner_noise",
      "tagalong_noise",
      "damaged_goods",
    ]);

    expect(noise).toMatchObject({
      finitePoolEconomy: false,
      loanDebtEconomy: false,
      downsideEconomy: false,
      handSizeSupport: false,
    });
  });
});

describe("Runner economy diagnostic counts", () => {
  it("attributes an economy skip to the selected action", () => {
    const context = {
      draw: false,
      setupAction: false,
      installsBreaker: false,
      advancedRemoteContestTaken: false,
      pressureAction: false,
    };
    const pass = {
      ...action(),
      type: "decline_trash" as const,
    };
    expect(
      runnerEconomySkipReasonForDiagnostics({
        ...context,
        action: pass,
      }),
    ).toBe("unknown_higher_priority");
    expect(
      runnerEconomySkipReasonForDiagnostics({
        ...context,
        setupAction: true,
        installsBreaker: true,
        action: action(),
      }),
    ).toBe("install_breaker");
    expect(
      runnerEconomySkipReasonForDiagnostics({
        ...context,
        advancedRemoteContestTaken: true,
        action: { ...action(), type: "start_run" },
      }),
    ).toBe("remote_contest");
  });

  it("counts overlapping economy categories and omits empty categories", () => {
    const one = classify(["finite_economy_pool", "loan_debt"]);
    const two = classify(["recurring_income"]);
    expect(runnerEconomySubcounts([one, two])).toEqual({
      runnerLegalFinitePoolEconomyActions: 1,
      runnerLegalLoanDebtEconomyActions: 1,
      runnerLegalRecurringEconomyActions: 1,
      runnerLegalResourceEconomyActions: 2,
    });
  });
});

function classify(roles: string[]) {
  return runnerEconomySetupActionClass(input(), action(), {
    sourceDefinitionIdForAction: () => undefined,
    definitionForAction: () => ({ type: "resource", mechanics: [] }),
    rolesForAction: () => roles,
    isRunnerEconomyAction: () => true,
    runnerCoverageSearchActionForMetrics: () => false,
    runnerCoverageRecoveryActionForMetrics: () => false,
  });
}

function input(): AiDecisionInput {
  return { side: "runner" } as AiDecisionInput;
}

function action(): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "install_card",
    label: "Use action",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
