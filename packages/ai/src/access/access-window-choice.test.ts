import { describe, expect, it } from "vitest";
import { accessDecisionProjectionDebugEvidence } from "./access-decision-debug";
import {
  accessWindowIntendedAction,
  accessWindowProjectionTarget,
  projectAccessWindowChoice,
} from "./access-window-choice";

describe("access window choice", () => {
  it("maps access window actions to access intents", () => {
    expect(accessWindowIntendedAction("steal_agenda")).toBe("steal");
    expect(accessWindowIntendedAction("trash_accessed_card")).toBe("trash");
    expect(accessWindowIntendedAction("decline_trash")).toBe("decline");
    expect(accessWindowIntendedAction("draw_card")).toBe("access_only");
  });

  it("maps index target types to access projection targets", () => {
    expect(accessWindowProjectionTarget("agenda")).toBe("agenda");
    expect(accessWindowProjectionTarget("asset_node")).toBe("asset");
    expect(accessWindowProjectionTarget("upgrade")).toBe("upgrade");
    expect(accessWindowProjectionTarget("ambiguous")).toBe("unknown");
  });

  it("projects access window trash choices with debug evidence", () => {
    const projection = projectAccessWindowChoice({
      actionType: "trash_accessed_card",
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_322_euromarket-consortium",
      targetType: "asset_node",
      trashCost: 4,
      generalTrashCost: 2,
      dedicatedTrashCredits: 2,
      reserveWouldBreak: false,
      finitePoolValueRemaining: 6,
    });

    expect(projection).toMatchObject({
      source: "access_window",
      serverId: "remote_1",
      target: "asset",
      intendedAccessAction: "trash",
      projections: [
        "asset_trash",
        "finite_pool_value_remaining",
        "trash_cost_waiver",
      ],
    });
    expect(accessDecisionProjectionDebugEvidence(projection)).toEqual(
      expect.arrayContaining([
        "access_decision_debug_source:access_window",
        "access_decision_debug_server:remote_1",
        "access_decision_debug_target:asset",
        "access_decision_debug_intended_action:trash",
        "access_decision_debug_projection:asset_trash",
      ]),
    );
  });

  it("keeps steal and decline projections invariant-safe", () => {
    expect(
      projectAccessWindowChoice({
        actionType: "steal_agenda",
        serverId: "remote_1",
        knownRootDefinitionId: "simple_agenda",
        targetType: "unknown",
        trashCost: 4,
        generalTrashCost: 0,
        dedicatedTrashCredits: 4,
        reserveWouldBreak: false,
        finitePoolValueRemaining: 0,
      }),
    ).toMatchObject({
      target: "agenda",
      intendedAccessAction: "steal",
      projections: ["agenda_steal"],
    });

    expect(
      projectAccessWindowChoice({
        actionType: "decline_trash",
        serverId: "remote_1",
        targetType: "asset_node",
        trashCost: 4,
        generalTrashCost: 0,
        dedicatedTrashCredits: 4,
        reserveWouldBreak: true,
        finitePoolValueRemaining: 0,
      }),
    ).toMatchObject({
      target: "asset",
      intendedAccessAction: "decline",
      projections: ["decline_trash", "reserve_would_break"],
    });
  });
});
