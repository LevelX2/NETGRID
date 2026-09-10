import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  rematerializedRunnerCreditBankBuildCandidate,
  runnerCreditBankProspectivePlan,
} from "./runner-credit-bank-prospective-planning";

const stateIdentity = {
  stateVersion: 12,
  sideSafePlanningFingerprint: "broker-prospective-test",
};

describe("runner credit-bank prospective planning", () => {
  it("admits Rigged Investments through its automatic lifecycle payout without inventing a cash-out action", () => {
    const plan = runnerCreditBankProspectivePlan({
      sourceDefinitionId: "onr_v1_174_rigged-investments",
      sourceCardInstanceId: "rigged-1",
      currentCredits: 5,
      currentActions: 4,
      stateIdentity,
    });

    expect(plan).toMatchObject({
      sourceDefinitionId: "onr_v1_174_rigged-investments",
      sourceCardInstanceId: "rigged-1",
      owner: "runner.credit_bank",
      install: {
        projection: "feasible_in_projection",
        creditCost: 4,
      },
      build: {
        kind: "install_lifecycle",
        projection: "feasible_in_projection",
        hostedCreditsAdded: 12,
      },
      cashOut: {
        kind: "automatic_lifecycle",
        phase: "start_of_runner_turn",
        creditsPerTrigger: 1,
      },
    });
    expect(plan?.evidenceCodes).toEqual(
      expect.arrayContaining([
        "runner_credit_bank_loaded_by_install_lifecycle",
        "runner_credit_bank_automatic_lifecycle_payout",
      ]),
    );
    expect(JSON.stringify(plan)).not.toContain("actionId");
  });

  it("treats Short-Term Contract's on-install load as the bank build", () => {
    const plan = runnerCreditBankProspectivePlan({
      sourceDefinitionId: "onr_v1_178_short-term-contract",
      sourceCardInstanceId: "contract-1",
      currentCredits: 1,
      currentActions: 4,
      stateIdentity,
    });

    expect(plan).toMatchObject({
      install: {
        projection: "feasible_in_projection",
        creditCost: 1,
      },
      build: {
        kind: "install_lifecycle",
        projection: "feasible_in_projection",
        resolution: "feasible_in_projection",
        actionCost: 0,
        hostedCreditsAdded: 12,
      },
      cashOut: {
        capabilityKey: "abilities_activated_runner_main_take_hosted_credits",
      },
    });
    expect(plan?.evidenceCodes).toContain(
      "runner_credit_bank_loaded_by_install_lifecycle",
    );
    expect(
      plan && rematerializedRunnerCreditBankBuildCandidate(plan, []),
    ).toBeUndefined();
  });

  it("binds Broker install plus future build from the PlanningCardView without inventing an actionId", () => {
    const plan = runnerCreditBankProspectivePlan({
      sourceDefinitionId: "onr_v1_154_broker",
      sourceCardInstanceId: "broker-1",
      currentCredits: 3,
      currentActions: 4,
      stateIdentity,
    });

    expect(plan).toMatchObject({
      sourceDefinitionId: "onr_v1_154_broker",
      sourceCardInstanceId: "broker-1",
      owner: "runner.credit_bank",
      install: {
        availability: "available_by_spec",
        projection: "feasible_in_projection",
        creditCost: 3,
        actionCost: 1,
        remainingActions: 3,
        installChoices: "feasible_in_projection",
      },
      build: {
        availability: "available_by_spec",
        projection: "feasible_in_projection",
        resolution: "requires_engine_quote",
        capabilityKey: "store_credits",
        canonicalCapabilityId: "onr_v1_154_broker:store_credits",
        actionCost: 1,
        hostedCreditsAdded: 3,
        sharedLimit: {
          kind: "once_per_turn_per_source",
          scope: "any_ability_on_source",
        },
        futureInvocation: {
          semanticActionType: "card_ability.trigger",
          sourceCardInstanceId: "broker-1",
          sourceAbilityBinding: {
            kind: "card_spec_capability_key",
            sourceAbilityId: "onr_v1_154_broker:store_credits",
          },
        },
      },
      cashOut: {
        availability: "available_by_spec",
        projection: "blocked",
        resolution: "requires_engine_quote",
        capabilityKey: "withdraw_credits",
      },
    });
    expect(JSON.stringify(plan)).not.toContain("actionId");
  });

  it("keeps a last-action install feasible but blocks the same-turn build projection", () => {
    const plan = runnerCreditBankProspectivePlan({
      sourceDefinitionId: "onr_v1_154_broker",
      sourceCardInstanceId: "broker-1",
      currentCredits: 3,
      currentActions: 1,
      stateIdentity,
    });

    expect(plan?.install.projection).toBe("feasible_in_projection");
    expect(plan?.install.remainingActions).toBe(0);
    expect(plan?.build.projection).toBe("blocked");
    expect(plan?.evidenceCodes).toContain(
      "runner_credit_bank_build_requires_later_rematerialization",
    );
  });

  it("rematerializes only the exact current Engine candidate for the same instance, capability and owner", () => {
    const plan = runnerCreditBankProspectivePlan({
      sourceDefinitionId: "onr_v1_154_broker",
      sourceCardInstanceId: "broker-1",
      currentCredits: 3,
      currentActions: 2,
      stateIdentity,
    });
    if (!plan) throw new Error("missing prospective Broker plan");

    const exact = candidate({
      actionId: "broker-1-build-current",
      sourceCardInstanceId: "broker-1",
      abilityId: "onr_v1_154_broker:store_credits",
      route: "build",
    });
    const sibling = candidate({
      actionId: "broker-2-build-current",
      sourceCardInstanceId: "broker-2",
      abilityId: "onr_v1_154_broker:store_credits",
      route: "build",
    });
    const cashOut = candidate({
      actionId: "broker-1-cash-current",
      sourceCardInstanceId: "broker-1",
      abilityId: "onr_v1_154_broker:withdraw_credits",
      route: "cash_out",
    });

    expect(
      rematerializedRunnerCreditBankBuildCandidate(plan, [
        sibling,
        cashOut,
        exact,
      ]),
    ).toBe(exact);
    expect(
      rematerializedRunnerCreditBankBuildCandidate(plan, [exact, { ...exact }]),
    ).toBeUndefined();
  });

  it("fails closed for a non-bank specification and an unaffordable install", () => {
    expect(
      runnerCreditBankProspectivePlan({
        sourceDefinitionId: "onr_v1_001_afreet",
        sourceCardInstanceId: "afreet-1",
        currentCredits: 20,
        currentActions: 4,
        stateIdentity,
      }),
    ).toBeUndefined();
    expect(
      runnerCreditBankProspectivePlan({
        sourceDefinitionId: "onr_v1_154_broker",
        sourceCardInstanceId: "broker-1",
        currentCredits: 2,
        currentActions: 4,
        stateIdentity,
      })?.install.projection,
    ).toBe("blocked");
  });
});

function candidate(params: {
  actionId: string;
  sourceCardInstanceId: string;
  abilityId: string;
  route: "build" | "cash_out";
}): ActionSemanticCandidate {
  return {
    actionId: params.actionId,
    sourceDefinitionId: "onr_v1_154_broker",
    sourceCardInstanceId: params.sourceCardInstanceId,
    abilityId: params.abilityId,
    abilityBindingMethod: "canonical_capability_id",
    planOwnerBinding: {
      capabilityKey: params.abilityId.split(":")[1]!,
      owner: "runner.credit_bank",
      route: params.route,
    },
  } as ActionSemanticCandidate;
}
