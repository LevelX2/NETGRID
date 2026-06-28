import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { runnerEconomySetupActionClass } from "./runner-economy-setup-types";

describe("runnerEconomySetupActionClass", () => {
  it("matches economy setup roles by bounded role terms", () => {
    const structured = classify(["finite_economy_pool", "loan_debt", "tag_risk"]);

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
