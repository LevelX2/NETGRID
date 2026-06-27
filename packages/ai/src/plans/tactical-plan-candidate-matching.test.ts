import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

import { bankStepMatchesCandidate } from "./tactical-plan-candidate-matching";
import type { PlanStep } from "./tactical-plan-types";

describe("bankStepMatchesCandidate", () => {
  it("uses semantic candidate signals and ignores label-only bank text", () => {
    const step = { kind: "cash_out_bank" } as PlanStep;
    const action = {
      actionId: "bank-action",
      label: "Credits aus Bank nehmen",
    } as LegalAction;

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
});

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
