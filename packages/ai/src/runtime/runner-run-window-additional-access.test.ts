import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { describe, expect, it } from "vitest";

import {
  assessRunnerAdditionalAccessRunWindowAction,
  runnerCandidateHasVisibleAdditionalAccessEffect,
} from "./runner-run-window-additional-access";

describe("Runner additional-access run-window admission", () => {
  it("admits a visible R&D additional-access effect for its bound multiaccess parent", () => {
    const candidate = additionalAccessCandidate({
      effectTargets: ["access.rnd_hidden_multiaccess"],
    });

    expect(runnerCandidateHasVisibleAdditionalAccessEffect(candidate)).toBe(
      true,
    );
    expect(
      assessRunnerAdditionalAccessRunWindowAction({
        candidate,
        activeServerId: "rd",
        runOriginPurpose: "multiaccess",
      }),
    ).toEqual({
      admissible: true,
      value: 500,
      evidenceCodes: [
        "runner_visible_additional_access_effect_plan_admissible",
        "runner_additional_access_effect_server:rd",
        "runner_additional_access_parent_purpose:multiaccess",
        "runner_additional_access_current_engine_legal_route_funded",
        "runner_additional_access_positive_effect_preferred_over_continue",
      ],
    });
  });

  it("fails closed when the visible effect belongs to another server", () => {
    expect(
      assessRunnerAdditionalAccessRunWindowAction({
        candidate: additionalAccessCandidate({
          effectTargets: ["access.hq_hidden_multiaccess"],
        }),
        activeServerId: "rd",
        runOriginPurpose: "multiaccess",
      }),
    ).toEqual({
      admissible: false,
      evidenceCodes: [
        "runner_additional_access_effect_server_mismatch:rd",
        "runner_additional_access_effect_scopes:hq",
      ],
    });
  });

  it("binds a current Engine-legal additional-access effect to the exact run window", () => {
    expect(
      assessRunnerAdditionalAccessRunWindowAction({
        candidate: additionalAccessCandidate({
          effectTargets: ["access.rnd_hidden_multiaccess"],
        }),
        activeServerId: "rd",
        runOriginPurpose: "information",
      }),
    ).toEqual({
      admissible: true,
      value: 500,
      evidenceCodes: [
        "runner_visible_additional_access_effect_plan_admissible",
        "runner_additional_access_effect_server:rd",
        "runner_additional_access_exact_engine_window_parent",
        "runner_additional_access_prior_parent_purpose:information",
        "runner_additional_access_current_engine_legal_route_funded",
        "runner_additional_access_positive_effect_preferred_over_continue",
      ],
    });
  });

  it("does not classify a generic unresolved card ability as an access effect", () => {
    const candidate = additionalAccessCandidate({
      effectTargets: [],
      payoffs: [],
    });

    expect(runnerCandidateHasVisibleAdditionalAccessEffect(candidate)).toBe(
      false,
    );
    expect(
      assessRunnerAdditionalAccessRunWindowAction({
        candidate,
        activeServerId: "rd",
        runOriginPurpose: "multiaccess",
      }),
    ).toBeUndefined();
  });
});

function additionalAccessCandidate(params: {
  effectTargets: string[];
  payoffs?: NonNullable<
    ActionSemanticCandidate["runAccessDecisionModel"]
  >["payoffs"];
}): ActionSemanticCandidate {
  return {
    actionId: "runner.activated_card_ability.visible-additional-access",
    actionType: "activated_card_ability",
    actorSide: "runner",
    visibilityScope: "public",
    legalActionRef: {
      actionId: "runner.activated_card_ability.visible-additional-access",
      actionType: "activated_card_ability",
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    abilityBindingMethod: "unresolved",
    semanticActionType: "card_ability.unknown",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      paidBy: "runner",
      beneficiary: "runner",
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "low",
    primaryProjectionStatus: "partial_projected",
    projectionIssues: ["ability_unresolved"],
    hardGates: [],
    evidence: [],
    effectTargets: params.effectTargets,
    runAccessDecisionModel: {
      schemaVersion: "run-access-decision-model-v1",
      coverageStatus: "covered",
      modifiers: [],
      accessRisks: [],
      payoffs: params.payoffs ?? ["additional_access"],
      unknownRemoteIdentityPreserved: true,
      hiddenInfoPolicy: "side_safe_visible_only",
      whyNot: [],
      evidence: [],
    },
  };
}
