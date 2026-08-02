import { describe, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-disgruntled-01-post-pass-derez-d277.json";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Disgruntled Ice Technician run-window checkpoint", () => {
  it("keeps the real post-pass ability inside runner.convert_run_window", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    const actionId =
      "runner.trigger_ability.runner_onr_proteus_106_disgruntled-ice-technician_1.runner_onr_proteus_106_disgruntled-ice-technician_1";
    const planInstanceId = "plan:runner.convert_run_window:run%3A277";
    expect(result.selectedAction).toMatchObject({
      actionId,
      source: "runner_onr_proteus_106_disgruntled-ice-technician_1",
      timingPoint: "run.jack_out_window",
      expiresAtStateVersion: 277,
      payload: {
        abilityId: "derez_fully_broken_passed_ice_and_end_run",
        sourceDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
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
      visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
        result.input.playerView,
      ),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    }).find((entry) => entry.actionId === actionId);
    expect(candidate).toMatchObject({
      sourceKind: "card",
      sourceCardInstanceId:
        "runner_onr_proteus_106_disgruntled-ice-technician_1",
      sourceDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
      abilityId: "derez_fully_broken_passed_ice_and_end_run",
      abilityBindingMethod: "engine_payload",
      projectionIssues: [],
    });
    expect(JSON.stringify(result.input)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken/,
    );
  });
});
