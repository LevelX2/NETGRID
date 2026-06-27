import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { candidateSemanticsMatchStep } from "./tactical-plan-step-semantics";
import type { PlanStep } from "./tactical-plan-types";

describe("tactical plan step semantics", () => {
  it("matches structured candidate tokens without free-text evidence", () => {
    expect(
      candidateSemanticsMatchStep(
        step("install_breaker"),
        candidate({
          semanticActionType: "install.card",
          cardContextSignals: ["breaker_fracter"],
        }),
      ),
    ).toBe(true);
    expect(
      candidateSemanticsMatchStep(
        step("setup_search_engine"),
        candidate({
          semanticActionType: "install.card",
          actionTacticSignals: ["setup.program_search"],
        }),
      ),
    ).toBe(true);
  });

  it("ignores label-like free-text evidence", () => {
    expect(
      candidateSemanticsMatchStep(
        step("install_breaker"),
        candidate({ evidence: ["install.card breaker"] }),
      ),
    ).toBe(false);
    expect(
      candidateSemanticsMatchStep(
        step("protect_remote"),
        candidate({ evidence: ["protect remote scoreline"] }),
      ),
    ).toBe(false);
  });
});

function step(kind: PlanStep["kind"]): PlanStep {
  return { kind } as PlanStep;
}

function candidate(
  overrides: Partial<ActionSemanticCandidate> = {},
): ActionSemanticCandidate {
  return {
    actionId: "candidate",
    semanticActionType: "unknown",
    sourceCardId: undefined,
    abilityId: undefined,
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { additionalCosts: [] },
    evidence: [],
    ...overrides,
  } as ActionSemanticCandidate;
}
