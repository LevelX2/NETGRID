import { describe, expect, it } from "vitest";

import { projectAccessDecision } from "./access-decision-projection";

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
});
