import { describe, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-disgruntled-01-post-pass-derez-d277.json";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Disgruntled Ice Technician run-window checkpoint", () => {
  it("binds the persisted Rent-I-Con continuation to its canonical CardSpec capability", () => {
    const checkpoint = structuredClone(
      checkpointJson,
    ) as AiDecisionCheckpointV1;
    const portfolio = checkpoint.runtime.residentPlanPortfolio;
    if (!portfolio)
      throw new Error("Expected persisted resident plan portfolio");
    const commitment = portfolio.turnPlanCommitment;
    const lease = portfolio.turnPlanExecutionLease;
    const invocation = commitment?.phases[0]?.nodes[0]?.invocation;

    expect(invocation).toMatchObject({
      semanticActionType: "breaker.break_subroutine",
      sourceCardInstanceId: "c7t",
      sourceAbilityBinding: {
        kind: "card_spec_capability_key",
        sourceAbilityId:
          48,
      },
      routeKey: "fnv1a:8b17fa41",
    });
    expect(invocation?.sourceAbilityBinding).not.toHaveProperty("abilityId");
    expect(commitment).toMatchObject({
      commitmentId: "fnv1a:830dc6b3",
      sourceLineHash: "fnv1a:a96a603c",
      nextExpectedTransition: {
        expectationId: "fnv1a:43abb6cc",
        routeKey: "fnv1a:8b17fa41",
      },
    });
    expect(lease).toMatchObject({
      leaseId: "fnv1a:9f371af3",
      commitmentId: "fnv1a:830dc6b3",
      sourcePlanId: "fnv1a:c51cc578",
      phaseId: "fnv1a:60c4adf9",
      nodeId: "fnv1a:ef151d9b",
      routeKey: "fnv1a:8b17fa41",
      expectationId: "fnv1a:43abb6cc",
      currentBinding: {
        actionId:
          "runner.break_subroutine.c7t.c7t.c7t.c2rx.0.printed_subroutines_end_the_run.48",
        stateVersion: 275,
        semanticActionSetFingerprint: "fnv1a:5911b86e",
        invocationKey: "fnv1a:95cb89ce",
      },
    });
  });

  it("keeps the real post-pass ability inside runner.convert_run_window", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    const actionId =
      "runner.trigger_ability.c10h.c10h.227";
    const planInstanceId = "plan:runner.convert_run_window:run%3A273";
    expect(result.selectedAction).toMatchObject({
      actionId,
      source: "c10h",
      timingPoint: "run.jack_out_window",
      expiresAtStateVersion: 277,
      payload: {
        abilityId: "derez_fully_broken_passed_ice_and_end_run",
        sourceDefinitionId: 164,
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityKey:
          "post_pass_derez_fully_broken_ice_end_run",
        cardImplementationAbilityId:
          227,
        targetIceId: "c2rx",
        targetIceDefinitionId: 449,
        paymentAmount: 0,
      },
    });
    expect(result.selectedAction?.payload).not.toHaveProperty(
      "runnerUtilityAbility",
    );
    expect(result.decision).toMatchObject({
      actionId,
      fallbackUsed: false,
      reasonCode: "plan_first.runner.convert_run_window",
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          stateVersion: 277,
          selectionAuthority: "turn_plan_commitment",
          rootPlanInstanceId: planInstanceId,
          leafExecutorInstanceId: planInstanceId,
          route: {
            planInstanceId,
            stepId: `${planInstanceId}:convert`,
            capabilityId: "convert_active_run_window",
            actionId,
            actionType: "trigger_ability",
            semanticActionType: "card_ability.trigger",
            stateVersion: 277,
          },
        },
      },
    });
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        "plan_action_assessment_evidence:runner_post_pass_derez_and_end_run_plan_admissible",
        "plan_action_assessment_evidence:runner_post_pass_target:c2rx",
      ]),
    );

    const candidate = buildActionSemanticCandidates({
      legalActions: result.input.legalActions,
      observerSide: "runner",
      stateVersion: 277,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(result.input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    }).find((entry) => entry.actionId === actionId);
    expect(candidate).toMatchObject({
      sourceKind: "card",
      sourceCardInstanceId:
        "c10h",
      sourceDefinitionId: 164,
      abilityId:
        227,
      abilityBindingMethod: "canonical_capability_id",
      projectionIssues: [],
    });
    expect(JSON.stringify(result.input)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken/,
    );
  });
});
