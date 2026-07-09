import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";

import { rankKnownRemoteAccessTargets } from "../access/access-target-ranking";
import { projectAccessDecision } from "./access-decision-projection";
import {
  buildTargetChoiceShadowReport,
  targetChoiceWouldSelectForAccessDecisionProjection,
} from "./target-choice-shadow";

describe("access decision projection", () => {
  it("projects agenda steal consistently", () => {
    const projection = projectAccessDecision({
      source: "pre_run",
      serverId: "remote_1",
      knownRootDefinitionId: "simple_agenda",
      target: "agenda",
      intendedAccessAction: "steal",
    });

    expect(projection.projections).toEqual(["agenda_steal"]);
    expect(projection.evidence).toEqual(
      expect.arrayContaining([
        "access_decision_projection_source:pre_run",
        "access_decision_projection_intended_action:steal",
        "access_decision_projection:agenda_steal",
      ]),
    );
  });

  it("projects visible agenda steal costs consistently", () => {
    const projection = projectAccessDecision({
      source: "access_window",
      serverId: "remote_1",
      knownRootDefinitionId: "simple_agenda",
      target: "agenda",
      intendedAccessAction: "steal",
      stealCost: 5,
    });

    expect(projection.projections).toEqual([
      "agenda_steal",
      "agenda_steal_cost",
    ]);
    expect(projection.evidence).toEqual(
      expect.arrayContaining([
        "access_decision_projection:agenda_steal",
        "access_decision_projection:agenda_steal_cost",
        "access_decision_projection_steal_cost:5",
      ]),
    );
  });

  it("projects asset trash with finite pool and trash-cost waiver", () => {
    const projection = projectAccessDecision({
      source: "access_window",
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      target: "asset",
      intendedAccessAction: "trash",
      trashCost: 4,
      generalTrashCost: 2,
      dedicatedTrashCredits: 2,
      finitePoolValueRemaining: 12,
    });

    expect(projection.projections).toEqual([
      "asset_trash",
      "finite_pool_value_remaining",
      "trash_cost_waiver",
    ]);
    expect(projection.evidence).toEqual(
      expect.arrayContaining([
        "access_decision_projection_source:access_window",
        "access_decision_projection:asset_trash",
        "access_decision_projection:trash_cost_waiver",
        "access_decision_projection:finite_pool_value_remaining",
        "access_decision_projection_finite_pool_value_remaining:12",
      ]),
    );
  });

  it("projects free upgrade trash", () => {
    const projection = projectAccessDecision({
      source: "access_window",
      serverId: "remote_2",
      target: "upgrade",
      intendedAccessAction: "trash",
      trashCost: 3,
      generalTrashCost: 0,
      dedicatedTrashCredits: 3,
    });

    expect(projection.projections).toEqual([
      "free_trash",
      "trash_cost_waiver",
      "upgrade_trash",
    ]);
  });

  it("projects declined trash and reserve break for plan memory", () => {
    const projection = projectAccessDecision({
      source: "plan_memory",
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      target: "asset",
      intendedAccessAction: "decline",
      trashCost: 7,
      generalTrashCost: 7,
      reserveWouldBreak: true,
      finitePoolValueRemaining: 8,
    });

    expect(projection.projections).toEqual([
      "decline_trash",
      "finite_pool_value_remaining",
      "reserve_would_break",
    ]);
    expect(projection.evidence).toContain(
      "access_decision_projection_source:plan_memory",
    );
  });

  it("uses target-choice wouldSelect as dry-run evidence without materializing selections", () => {
    const targetChoiceReport = buildTargetChoiceShadowReport({
      action: action({
        choiceRequirements: [
          {
            choiceId: "access-trash-choice",
            minSelections: 1,
            maxSelections: 1,
            optionIds: ["trash", "decline"],
          },
        ],
      }),
      preferredOptionIds: ["trash"],
    });
    const targetChoiceWouldSelect =
      targetChoiceWouldSelectForAccessDecisionProjection(targetChoiceReport);

    expect(targetChoiceWouldSelect).toBeDefined();
    if (!targetChoiceWouldSelect) {
      throw new Error("expected target-choice wouldSelect dry-run");
    }
    const projection = projectAccessDecision({
      source: "access_window",
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      target: "asset",
      intendedAccessAction: "trash",
      targetChoiceWouldSelect,
    });

    expect(projection.projections).toEqual([
      "asset_trash",
      "target_choice_would_select",
    ]);
    expect(projection.targetChoiceWouldSelect).toEqual(
      expect.objectContaining({
        requirementId: "access-trash-choice",
        optionId: "trash",
        selectedChoicesCreated: false,
        selectedTargetsCreated: false,
      }),
    );
    expect(projection.evidence).toEqual(
      expect.arrayContaining([
        "access_decision_projection_target_choice_would_select:dry_run",
        "access_decision_projection_target_choice_requirement:access-trash-choice",
        "access_decision_projection_target_choice_option:trash",
        "access_decision_projection_target_choice_selected_choices_created:false",
        "access_decision_projection_target_choice_selected_targets_created:false",
        "access_decision_projection_target_choice_evidence:target_choice_access_decision_projection:dry_run",
      ]),
    );
    expect(projection).not.toHaveProperty("selectedChoices");
    expect(projection).not.toHaveProperty("selectedTargets");
  });

  it("aligns access target ranking with target-choice dry-run projection", () => {
    const targetChoiceReport = buildTargetChoiceShadowReport({
      action: action({
        choiceRequirements: [
          {
            choiceId: "access-trash-choice",
            minSelections: 1,
            maxSelections: 1,
            optionIds: ["trash", "decline"],
          },
        ],
      }),
      preferredOptionIds: ["trash"],
    });
    const targetChoiceWouldSelect =
      targetChoiceWouldSelectForAccessDecisionProjection(targetChoiceReport);
    if (!targetChoiceWouldSelect) {
      throw new Error("expected target-choice wouldSelect dry-run");
    }
    const projection = projectAccessDecision({
      source: "access_window",
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_322_euromarket-consortium",
      target: "asset",
      intendedAccessAction: "trash",
      targetChoiceWouldSelect,
    });

    const [ranked] = rankKnownRemoteAccessTargets([
      {
        positionKey: "root:0",
        instanceId: "euromarket-1",
        definitionId: "onr_v1_322_euromarket-consortium",
        targetKind: "asset",
        commitment: {
          serverId: "remote_1",
          knownAccessState: "known_payoff",
          intendedAccessAction: "trash",
          reason: "trash_affordable",
          evidence: ["test_access_commitment"],
        },
        projection,
        valueScore: 3,
      },
    ]);

    expect(ranked).toMatchObject({
      positionKey: "root:0",
      targetKind: "asset",
      commitment: {
        intendedAccessAction: "trash",
        reason: "trash_affordable",
      },
      projection: {
        projections: ["asset_trash", "target_choice_would_select"],
        targetChoiceWouldSelect: {
          optionId: "trash",
          selectedChoicesCreated: false,
          selectedTargetsCreated: false,
        },
      },
    });
    expect(ranked?.rankEvidence).toEqual(
      expect.arrayContaining([
        "access_target_rank_position:root:0",
        "access_target_rank_intent:trash",
      ]),
    );
    expect(ranked?.projection.evidence).toEqual(
      expect.arrayContaining([
        "access_decision_projection_target_choice_option:trash",
        "access_decision_projection_target_choice_selected_choices_created:false",
        "access_decision_projection_target_choice_selected_targets_created:false",
      ]),
    );
  });
});

function action(options: {
  choiceRequirements?: LegalAction["choiceRequirements"];
}): LegalAction {
  return {
    actionId: "resolve-access-choice",
    side: "runner",
    type: "resolve_choice",
    label: "Resolve access choice",
    source: "game_rule",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    ...(options.choiceRequirements
      ? { choiceRequirements: options.choiceRequirements }
      : {}),
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
}
