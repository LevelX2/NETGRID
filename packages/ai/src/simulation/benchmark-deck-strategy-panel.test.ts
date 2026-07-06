import { describe, expect, it } from "vitest";
import {
  benchmarkCorpArchetypeFromRole,
  CORP_STRATEGY_PANEL_TARGETS,
  missingCorpStrategyPanelSlots,
} from "./benchmark-deck-strategy-panel";
import type { AiBenchmarkDeckSlotDefinition } from "./benchmark-deck-types";

describe("benchmark deck strategy panel", () => {
  it("keeps the Corp benchmark target matrix explicit", () => {
    expect(CORP_STRATEGY_PANEL_TARGETS).toEqual([
      "remote_scoring",
      "fast_advance",
      "tag_punish",
      "net_damage",
      "hybrid_score_punish",
      "virus_damage",
    ]);
  });

  it("adds pending gap slots only for missing Corp archetypes", () => {
    const existing = [
      slot("remote", "remote_scoring"),
      slot("tag", "tag_punish"),
    ];

    const gaps = missingCorpStrategyPanelSlots(existing);

    expect(gaps.map((gap) => gap.corpArchetype)).toEqual([
      "fast_advance",
      "net_damage",
      "hybrid_score_punish",
      "virus_damage",
    ]);
    expect(gaps.every((gap) => gap.status === "pending")).toBe(true);
    expect(gaps.every((gap) => gap.slotType === "strategy_panel_gap")).toBe(
      true,
    );
    expect(gaps.every((gap) => gap.tuningUse === "holdout_only")).toBe(true);
  });

  it("classifies future benchmark roles by Corp strategy archetype", () => {
    expect(
      benchmarkCorpArchetypeFromRole("real_scene_corp_fast_advance"),
    ).toBe("fast_advance");
    expect(
      benchmarkCorpArchetypeFromRole("real_scene_corp_net_damage"),
    ).toBe("net_damage");
    expect(
      benchmarkCorpArchetypeFromRole("real_scene_corp_hybrid_score_punish"),
    ).toBe("hybrid_score_punish");
    expect(
      benchmarkCorpArchetypeFromRole("real_scene_corp_virus_damage"),
    ).toBe("virus_damage");
    expect(
      benchmarkCorpArchetypeFromRole("real_scene_corp_tag_punish"),
    ).toBe("tag_punish");
    expect(
      benchmarkCorpArchetypeFromRole("real_scene_corp_glacier_remote_scoring"),
    ).toBe("remote_scoring");
  });
});

function slot(
  slotId: string,
  corpArchetype: AiBenchmarkDeckSlotDefinition["corpArchetype"],
): AiBenchmarkDeckSlotDefinition {
  return {
    slotId,
    label: slotId,
    slotType: "snapshot_tuning",
    status: "runnable",
    runner: { kind: "snapshot", snapshotId: `${slotId}_runner` },
    corp: { kind: "snapshot", snapshotId: `${slotId}_corp` },
    runnerArchetype: "rig_economy_pressure",
    corpArchetype,
    tuningUse: "progression_tuning",
  };
}
