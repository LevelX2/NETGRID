import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { assessRunnerAdditionalAccessRunWindowAction } from "../runtime/runner-run-window-additional-access";

describe("Proteus R&D Mole plan-first run-window coverage", () => {
  it("converts its exact funded R&D multiaccess action before continue", () => {
    const moleInstanceId = "runner_onr_proteus_147_r-and-d-mole_2";
    const legalActions: LegalAction[] = [
      {
        actionId: "runner.activate-rd-mole",
        side: "runner",
        type: "activated_card_ability",
        label: "Use R&D Mole",
        source: moleInstanceId,
        timingPoint: "game.checkpoint",
        costs: [{ credits: 4 }],
        targetRequirements: [],
        visibility: "public",
        expiresAtStateVersion: 69,
        payload: { cardId: moleInstanceId },
      },
      {
        actionId: "runner.continue-run-rd",
        side: "runner",
        type: "continue_run",
        label: "Continue run",
        source: "game_rule",
        timingPoint: "game.checkpoint",
        costs: [],
        targetRequirements: [],
        visibility: "public",
        expiresAtStateVersion: 69,
        payload: { serverId: "rd" },
      },
    ];

    const candidates = buildActionSemanticCandidates({
      legalActions,
      observerSide: "runner",
      stateVersion: 68,
      visibleSourceDefinitionsByInstanceId: {
        [moleInstanceId]: "onr_proteus_147_r-and-d-mole",
      },
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const moleCandidate = candidates.find(
      (candidate) =>
        candidate.sourceDefinitionId === "onr_proteus_147_r-and-d-mole",
    );

    expect(moleCandidate).toMatchObject({
      actionType: "activated_card_ability",
      semanticActionType: "card_ability.unknown",
      effectTargets: expect.arrayContaining(["access.rnd_hidden_multiaccess"]),
      runAccessDecisionModel: {
        coverageStatus: "covered",
        payoffs: expect.arrayContaining(["additional_access"]),
      },
    });
    if (!moleCandidate) throw new Error("Missing R&D Mole candidate");
    expect(
      assessRunnerAdditionalAccessRunWindowAction({
        candidate: moleCandidate,
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
});
