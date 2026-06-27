import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  runnerSelfDamageSurvivalAssessment,
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
      fakedHitCardId: "faked-hit",
      badPublicityLossThreshold: 7,
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

    const exclusion = semanticRuntimeActionExclusion(
      input,
      action,
      candidate,
      {
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
        runnerBlinkRunExclusion: () => undefined,
        knownCentralPayoffExclusion: () => undefined,
        runnerArchivesExclusion: () => undefined,
        runnerEmptyRemoteExclusion: () => undefined,
        isRemoteServerTarget: () => false,
        knownIcePathReason: () => "not_relevant",
      },
    );

    expect(exclusion).toMatchObject({
      key: "self_damage_flatline_risk",
    });
    expect(exclusion?.reason).toContain(
      "self_damage_contract:action_cost_profile",
    );
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

function runnerInput(action: LegalAction): AiDecisionInput {
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
        gripOrHq: [
          {
            known: true,
            instanceId: action.source,
          },
        ],
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
