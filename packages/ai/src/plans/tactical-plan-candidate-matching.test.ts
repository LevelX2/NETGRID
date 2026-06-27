import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

import { bankStepMatchesCandidate } from "./tactical-plan-candidate-matching";
import type { PlanStep } from "./tactical-plan-types";

describe("bankStepMatchesCandidate", () => {
  it("uses semantic candidate signals and ignores label-only bank text", () => {
    const step = { kind: "cash_out_bank" } as PlanStep;
    const action = legalAction({
      actionId: "bank-action",
      label: "Credits aus Bank nehmen",
    });

    expect(
      bankStepMatchesCandidate(
        step,
        candidate({ actionTacticSignals: ["cash_out_credit_bank"] }),
        action,
      ),
    ).toBe(true);
    expect(
      bankStepMatchesCandidate(
        step,
        candidate({ actionTacticSignals: [], semanticActionType: "economy" }),
        action,
      ),
    ).toBe(false);
  });

  it("uses hosted-credit payloads for bank step matching", () => {
    expect(
      bankStepMatchesCandidate(
        { kind: "build_bank_counter" } as PlanStep,
        candidate({ actionTacticSignals: [], semanticActionType: "unknown" }),
        legalAction({
          actionId: "build",
          label: "Use ability",
          payload: { cardImplementationAddsHostedCredits: true },
        }),
      ),
    ).toBe(true);

    expect(
      bankStepMatchesCandidate(
        { kind: "cash_out_bank" } as PlanStep,
        candidate({ actionTacticSignals: [], semanticActionType: "unknown" }),
        legalAction({
          actionId: "cash",
          label: "Use ability",
          payload: { cardImplementationTakesHostedCredits: true },
        }),
      ),
    ).toBe(true);
  });
});

function legalAction(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "trigger_ability",
    label: "Use ability",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}

function candidate(
  overrides: Partial<ActionSemanticCandidate> = {},
): ActionSemanticCandidate {
  return {
    actionId: "candidate",
    semanticActionType: "economy.temporary_resource_bank",
    actionTacticSignals: [],
    cardContextSignals: [],
    evidence: [],
    ...overrides,
  } as ActionSemanticCandidate;
}
