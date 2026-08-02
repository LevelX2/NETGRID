import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  runnerSelfDamageSurvivalAssessment,
  runnerSelfDamageSurvivalExclusion,
} from "./runner-self-damage-choice";
import { semanticRuntimeActionExclusion } from "./semantic-runtime-action-exclusion";

describe("runnerSelfDamageSurvivalAssessment", () => {
  it("uses semantic candidate self-damage cost profile before hint fallbacks", () => {
    const action = selfDamageAction();
    const input = runnerInput(action);
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      projectionMode: "basic_semantics",
    });
    if (!candidate) throw new Error("Expected self-damage candidate");

    const dependencies = {
      sourceDefinitionIdForAction: () => "semantic-self-damage-card",
      hintEffectsForCard: () => {
        throw new Error("Candidate self-damage should not require hints");
      },
      badPublicityLossThreshold: 7,
      cardAddressesVisibleBreakerNeed: () => false,
    };

    const assessment = runnerSelfDamageSurvivalAssessment(
      input,
      action,
      dependencies,
      candidate,
    );

    expect(assessment).toMatchObject({
      selfDamageAmount: 2,
      selfDamageType: "core",
      preventable: false,
      survivesSelfDamage: false,
      immediateWinByAction: false,
    });
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "self_damage_contract:action_cost_profile",
        `self_damage_candidate:${action.actionId}`,
        "why_self_damage_action_blocked:self_damage_flatline_risk",
      ]),
    );

    const exclusion = semanticRuntimeActionExclusion(input, action, candidate, {
      planMemoryActionExclusion: () => undefined,
      corpAdvancementCounterPlacementAssessment: () => undefined,
      runnerSelfDamageSurvivalExclusion: (
        exclusionInput,
        exclusionAction,
        actionSemanticCandidate,
      ) => {
        const exclusionAssessment = runnerSelfDamageSurvivalAssessment(
          exclusionInput,
          exclusionAction,
          dependencies,
          actionSemanticCandidate,
        );
        if (
          !exclusionAssessment ||
          exclusionAssessment.survivesSelfDamage ||
          exclusionAssessment.immediateWinByAction
        ) {
          return undefined;
        }
        return {
          key: "self_damage_flatline_risk",
          label: "Self-Damage-Flatline-Risiko",
          reason: exclusionAssessment.evidence.join("|"),
        };
      },
      runnerEncounterActionExclusion: () => undefined,
      runnerProgramSacrificeExclusion: () => undefined,
      runnerMultiRunEventExclusion: () => undefined,
      runnerRunTargetEvaluationForAction: () => undefined,
      runnerRandomBreakOrDamageRunExclusion: () => undefined,
      knownCentralPayoffExclusion: () => undefined,
      runnerArchivesExclusion: () => undefined,
      runnerEmptyRemoteExclusion: () => undefined,
      isRemoteServerTarget: () => false,
      knownIcePathReason: () => "not_relevant",
    });

    expect(exclusion).toMatchObject({
      key: "self_damage_flatline_risk",
    });
    expect(exclusion?.reason).toContain(
      "self_damage_contract:action_cost_profile",
    );
  });

  it("bounds structured self-damage hint targets", () => {
    const action = selfDamageAction();
    const input = runnerInput(action);

    const selfAssessment = runnerSelfDamageSurvivalAssessment(input, action, {
      sourceDefinitionIdForAction: () => "hint-self-damage-card",
      hintEffectsForCard: () => [selfDamageHintEffect("self")],
      badPublicityLossThreshold: 7,
      cardAddressesVisibleBreakerNeed: () => false,
    });
    const noiseAssessment = runnerSelfDamageSurvivalAssessment(input, action, {
      sourceDefinitionIdForAction: () => "hint-self-damage-card",
      hintEffectsForCard: () => [selfDamageHintEffect("selfish")],
      badPublicityLossThreshold: 7,
      cardAddressesVisibleBreakerNeed: () => false,
    });

    expect(selfAssessment).toMatchObject({
      selfDamageAmount: 1,
      selfDamageType: "net",
    });
    expect(noiseAssessment).toBeUndefined();
  });

  it("excludes unpreventable self-damage that risks the only visible breaker coverage", () => {
    const action = coverageRiskAction();
    const input = runnerInput(action, [
      { known: true, instanceId: action.source },
      { known: true, instanceId: "required-breaker" },
      { known: true, instanceId: "other-card" },
    ]);
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      projectionMode: "basic_semantics",
    });
    if (!candidate) throw new Error("Expected self-damage candidate");

    const dependencies = {
      sourceDefinitionIdForAction: () => "coverage-risk-card",
      hintEffectsForCard: () => undefined,
      badPublicityLossThreshold: 7,
      cardAddressesVisibleBreakerNeed: (
        _input: AiDecisionInput,
        card: { instanceId: string },
      ) => card.instanceId === "required-breaker",
    };
    const assessment = runnerSelfDamageSurvivalAssessment(
      input,
      action,
      dependencies,
      candidate,
    );

    expect(assessment).toMatchObject({
      survivesSelfDamage: true,
      unpreventable: true,
      visibleCoverageCardsAtRisk: 1,
      coverageLossRisk: true,
    });
    expect(
      runnerSelfDamageSurvivalExclusion(input, action, {
        survivalAssessment: () => assessment,
      }),
    ).toMatchObject({ key: "self_damage_coverage_loss_risk" });
  });

  it("allows self-damage when visible breaker coverage is not at risk", () => {
    const action = coverageRiskAction();
    const input = runnerInput(action, [
      { known: true, instanceId: action.source },
      { known: true, instanceId: "other-card" },
      { known: true, instanceId: "another-card" },
    ]);
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      projectionMode: "basic_semantics",
    });
    if (!candidate) throw new Error("Expected self-damage candidate");

    const assessment = runnerSelfDamageSurvivalAssessment(
      input,
      action,
      {
        sourceDefinitionIdForAction: () => "coverage-risk-card",
        hintEffectsForCard: () => undefined,
        badPublicityLossThreshold: 7,
        cardAddressesVisibleBreakerNeed: () => false,
      },
      candidate,
    );

    expect(assessment).toMatchObject({
      survivesSelfDamage: true,
      visibleCoverageCardsAtRisk: 0,
      coverageLossRisk: false,
    });
    expect(
      runnerSelfDamageSurvivalExclusion(input, action, {
        survivalAssessment: () => assessment,
      }),
    ).toBeUndefined();
  });
});

function selfDamageAction(): LegalAction {
  return {
    actionId: "runner-self-damage-action",
    label: "Runner self-damage action",
    type: "play_event",
    side: "runner",
    source: "runner-self-damage-card",
    costs: [],
    timingPoint: "runner_action.main",
    visibility: "private_to_actor",
    expiresAtStateVersion: 8,
    targetRequirements: [],
    choiceRequirements: [],
    payload: {
      damageType: "core",
      damageAmount: 2,
      unpreventableDamage: true,
    },
  } as unknown as LegalAction;
}

function coverageRiskAction(): LegalAction {
  return {
    ...selfDamageAction(),
    actionId: "runner-coverage-risk-action",
    source: "runner-coverage-risk-card",
    payload: {
      damageType: "core",
      damageAmount: 1,
      damageCannotBePrevented: true,
    },
  } as LegalAction;
}

function runnerInput(
  action: LegalAction,
  gripOrHq: Array<{ known: boolean; instanceId: string }> = [
    {
      known: true,
      instanceId: action.source,
    },
  ],
): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [action],
    profileId: "test-runner",
    difficulty: "normal",
    eventTail: [],
    seed: "runner-self-damage-candidate-test",
    decisionId: "runner-self-damage-candidate-test.1",
    actionNumber: 1,
    playerView: {
      stateVersion: 7,
      own: {
        credits: 0,
        gripOrHq,
      },
      opponent: {
        identity: {
          counterDisplays: [],
        },
      },
      servers: [],
    },
  } as unknown as AiDecisionInput;
}

function selfDamageHintEffect(target: string): Record<string, unknown> {
  return {
    kind: "damage",
    scope: "runner",
    timing: "action",
    amount: 1,
    resource: "net_damage",
    preventable: false,
    target,
  };
}
