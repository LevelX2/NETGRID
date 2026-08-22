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
      sourceCardInstanceId: "runner_onr_classic_031_rent-i-con_1",
      sourceAbilityBinding: {
        kind: "card_spec_capability_key",
        sourceAbilityId:
          "onr_classic_031_rent-i-con:break_any_subroutine_and_trash_after_run",
      },
      routeKey: "fnv1a:fd93466d",
    });
    expect(invocation?.sourceAbilityBinding).not.toHaveProperty("abilityId");
    expect(commitment).toMatchObject({
      commitmentId: "fnv1a:830dc6b3",
      sourceLineHash: "fnv1a:a96a603c",
      nextExpectedTransition: {
        expectationId: "fnv1a:43abb6cc",
        routeKey: "fnv1a:fd93466d",
      },
    });
    expect(lease).toMatchObject({
      leaseId: "fnv1a:9f371af3",
      commitmentId: "fnv1a:830dc6b3",
      sourcePlanId: "fnv1a:c51cc578",
      phaseId: "fnv1a:60c4adf9",
      nodeId: "fnv1a:ef151d9b",
      routeKey: "fnv1a:fd93466d",
      expectationId: "fnv1a:43abb6cc",
      currentBinding: {
        actionId:
          "runner.break_subroutine.runner_onr_classic_031_rent-i-con_1.runner_onr_classic_031_rent-i-con_1.runner_onr_classic_031_rent-i-con_1.corp_onr_v1_237_data-wall_1.0.printed_subroutines_end_the_run.onr_classic_031_rent-i-con:break_any_subroutine_and_trash_after_run",
        stateVersion: 275,
        semanticActionSetFingerprint: "fnv1a:37fee12a",
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
      "runner.trigger_ability.runner_onr_proteus_106_disgruntled-ice-technician_1.runner_onr_proteus_106_disgruntled-ice-technician_1.onr_proteus_106_disgruntled-ice-technician:post_pass_derez_fully_broken_ice_end_run";
    const planInstanceId = "plan:runner.convert_run_window:run%3Arun_273";
    expect(result.selectedAction).toMatchObject({
      actionId,
      source: "runner_onr_proteus_106_disgruntled-ice-technician_1",
      timingPoint: "run.jack_out_window",
      expiresAtStateVersion: 277,
      payload: {
        abilityId: "derez_fully_broken_passed_ice_and_end_run",
        sourceDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityKey:
          "post_pass_derez_fully_broken_ice_end_run",
        cardImplementationAbilityId:
          "onr_proteus_106_disgruntled-ice-technician:post_pass_derez_fully_broken_ice_end_run",
        targetIceId: "corp_onr_v1_237_data-wall_1",
        targetIceDefinitionId: "onr_v1_237_data-wall",
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
        "plan_action_assessment_evidence:runner_post_pass_target:corp_onr_v1_237_data-wall_1",
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
        "runner_onr_proteus_106_disgruntled-ice-technician_1",
      sourceDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
      abilityId:
        "onr_proteus_106_disgruntled-ice-technician:post_pass_derez_fully_broken_ice_end_run",
      abilityBindingMethod: "canonical_capability_id",
      projectionIssues: [],
    });
    expect(JSON.stringify(result.input)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken/,
    );
  });
});
