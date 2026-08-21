import { describe, expect, it } from "vitest";
import generatedArtifact from "../../../data/ai/card-spec-ai-hints-generated.json";

type ActiveHint = (typeof generatedArtifact.cards)[number]["hint"];

const hintsByCard = new Map(
  generatedArtifact.cards.map((record) => [record.cardId, record.hint]),
);

const DIRECT_PLACEMENT_CARDS = [
  "onr_v1_292_management-shake-up",
  "onr_v1_300_project-consultants",
  "onr_v1_304_systematic-layoffs",
  "onr_v1_305_team-restructuring",
  "onr_v1_312_chicago-branch",
] as const;

const TRANSFER_CARDS = [
  "onr_v1_291_falsified-transactions-expert",
  "onr_v1_347_vapor-ops",
] as const;

const IMMEDIATE_ACTION_CAPACITY_CARDS = [
  ["onr_v1_297_overtime-incentives", "action.corp_extra_action_burst"],
  ["onr_v1_334_pacifica-regional-ai", "action.corp_counter_to_action"],
  ["onr_v1_192_corporate-boon", "action.corp_extra_action"],
] as const;

const FUTURE_ACTION_CAPACITY_CARDS = [
  ["onr_v1_218_subsidiary-branch", "action.corp_recurring_extra_action"],
  ["onr_v1_331_nevinyrral", "action.corp_repeatable_extra_action"],
  ["onr_v1_335_remote-facility", "action.corp_repeatable_extra_action"],
] as const;

const OVERADVANCE_TARGETS = [
  "onr_v1_214_project-babylon",
  "onr_proteus_007_project-venice",
  "onr_proteus_008_project-zurich",
] as const;

describe("Corp score-conversion hint audit", () => {
  it.each(DIRECT_PLACEMENT_CARDS)(
    "%s exposes placement and score-window strategy signals",
    (cardId) => {
      const hint = requiredHint(cardId);
      expect(hint.requiredMechanics).toContain(
        "distribute_advancement_counters",
      );
      expect(strategyIds(hint)).toContain("corp.fast_advance");
    },
  );

  it.each(TRANSFER_CARDS)(
    "%s exposes transfer and score-window strategy signals",
    (cardId) => {
      const hint = requiredHint(cardId);
      expect(hint.requiredMechanics).toContain("move_advancement_counters");
      expect(strategyIds(hint)).toContain("corp.fast_advance");
    },
  );

  it.each(IMMEDIATE_ACTION_CAPACITY_CARDS)(
    "%s exposes immediate action-capacity semantics",
    (cardId) => {
      const hint = requiredHint(cardId);
      expect(hint.actionCapacityProfiles?.length).toBeGreaterThan(0);
      if (cardId === "onr_v1_297_overtime-incentives") {
        expect(hint.planRoles).not.toContain("recover_economy");
        expect(strategyIds(hint)).toContain("corp.fast_advance");
      }
    },
  );

  it.each(FUTURE_ACTION_CAPACITY_CARDS)(
    "%s keeps future action capacity distinct from immediate score conversion",
    (cardId) => {
      const hint = requiredHint(cardId);
      expect(hint.actionCapacityProfiles).toContainEqual(
        expect.objectContaining({
          class: "recurring_gain",
          timing: "start_of_turn",
          repeatable: true,
        }),
      );
    },
  );

  it.each(OVERADVANCE_TARGETS)(
    "%s exposes a concrete overadvance payoff",
    (cardId) => {
      expect(strategyIds(requiredHint(cardId))).toContain(
        "corp.overadvance_value",
      );
    },
  );

  it("keeps Vapor Ops both economy- and agenda-support visible", () => {
    const hint = requiredHint("onr_v1_347_vapor-ops");
    expect(hint.planRoles).toEqual(
      expect.arrayContaining([
        "remote_asset_economy",
        "remote_asset_agenda_support",
      ]),
    );
    expect(hint.requiredMechanics).toContain("move_advancement_counters");
  });

  it("binds Team Restructuring to distributed advancement evidence", () => {
    const hint = requiredHint("onr_v1_305_team-restructuring");
    expect(hint.strategySupportPairs).toContainEqual(
      expect.objectContaining({
        strategyId: "corp.fast_advance",
        roleDetail: "distributed_advance_counter_support",
        evidence: [
          "advance.counter_manipulation",
          "score.fast_advance_support",
        ],
      }),
    );
  });

  it("classifies Chicago Branch as score acceleration, never asset economy", () => {
    const hint = requiredHint("onr_v1_312_chicago-branch");
    expect(hint.remoteRole?.kind).toBe("score_acceleration");
    expect(hint.remoteRole?.kind).not.toBe("asset_economy");
    expect(hint.strategySupportPairs).toContainEqual(
      expect.objectContaining({
        strategyId: "corp.fast_advance",
        roleDetail: "advancement_enabler",
      }),
    );
  });
});

function requiredHint(cardId: string): ActiveHint {
  const hint = hintsByCard.get(cardId);
  expect(hint, `missing active AI hint for ${cardId}`).toBeDefined();
  return hint!;
}

function strategyIds(hint: ActiveHint): string[] {
  return (hint.strategySupportPairs ?? []).map((pair) => pair.strategyId);
}
