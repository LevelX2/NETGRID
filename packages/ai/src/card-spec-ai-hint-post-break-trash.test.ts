import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";
import { buildActionCardSemanticProfilesByDefinitionId } from "./actions/action-card-semantic-profiles";
import { rolesForDeckDoctrineCard } from "./deck-doctrine-card-roles";

const cardId = "onr_v1_068_startup-immolator";
function entry() {
  const card = cardSpecPlanningCards().find(
    (candidate) => candidate.definition.id === cardId,
  );
  if (!card) throw new Error("post_break_trash_test_card_missing");
  return structuredClone(card);
}

describe("typed post-pass fully-broken ICE trash semantics", () => {
  it("preserves the complete mechanical function in the compiler and generated hint", () => {
    for (const hint of [
      deriveCardSpecAiHint(entry()),
      AI_HINTS_BY_CARD.get(cardId)!,
    ]) {
      expect(hint.effects).toEqual(
        expect.arrayContaining([
          {
            kind: "ice_trash",
            scope: "ice",
            timing: "encounter_resolution",
            resource: "credits",
            target: "trash_fully_broken_passed_ice",
            finite: true,
          },
          {
            kind: "program_trash",
            scope: "installed_program",
            timing: "encounter_resolution",
            target: "source.trash",
            finite: true,
          },
        ]),
      );
      expect(hint.functionSignals).toEqual(
        expect.arrayContaining([
          "ice.trash",
          "economy.dynamic_rez_cost",
          "risk.self_trash",
        ]),
      );
      expect(hint.tacticSignals).toContain("ice.trash");
      expect(hint.roles).toEqual(
        expect.arrayContaining(["ice_trash", "fully_broken_ice"]),
      );
      expect(hint.requiredMechanics).toEqual(
        expect.arrayContaining([
          "fully_break_ice_window",
          "trash_ice",
          "target_rez_cost",
          "trash_source",
        ]),
      );
      expect(hint.riskTags).toEqual(
        expect.arrayContaining([
          "timing_window",
          "self_trash",
          "dynamic_rez_cost",
        ]),
      );
      expect(hint.costProfile).toMatchObject({
        clicks: 1,
        credits: 0,
        memory: 1,
      });
      expect(hint.targetProfiles).toBeUndefined();
      expect(hint.strategyAnchors ?? []).toEqual([]);
      expect(hint.planRoles).toEqual([]);
    }
    const semantic = buildActionCardSemanticProfilesByDefinitionId()[cardId]!;
    expect(semantic.functionalEffects).toContainEqual(
      expect.objectContaining({
        kind: "ice_trash",
        target: "trash_fully_broken_passed_ice",
      }),
    );
    expect(semantic.compatibilitySignals).toEqual(
      expect.arrayContaining([
        "ice.trash",
        "economy.dynamic_rez_cost",
        "risk.self_trash",
      ]),
    );
    expect(semantic.strategySupport).toEqual([]);
    expect(rolesForDeckDoctrineCard(cardId)).toEqual(
      expect.arrayContaining(["ice_trash", "fully_broken_ice"]),
    );
  });

  it("derives from the typed capability without card identity or planning annotations", () => {
    const original = entry();
    // A different supported identity keeps scenario evidence valid while
    // proving that the function comes from the capability, not the card name.
    const { planningAnnotations: _annotations, ...mechanicalPlanning } =
      original.planning;
    const renamed = {
      ...original,
      definition: {
        ...original.definition,
        id: "onr_v1_039_krash" as typeof original.definition.id,
      },
      planning: mechanicalPlanning,
    };
    const hint = deriveCardSpecAiHint(renamed);
    expect(hint.cardId).toBe("onr_v1_039_krash");
    expect(hint.effects).toContainEqual(
      expect.objectContaining({
        kind: "ice_trash",
        target: "trash_fully_broken_passed_ice",
      }),
    );
  });

  it.each([
    "undefined_costs",
    "null_cost",
    "missing_cost",
    "duplicate_cost",
    "wrong_source_amount",
    "wrong_cost_target",
    "wrong_timing",
    "wrong_target",
    "wrong_visibility",
  ])("rejects a malformed mechanical capability: %s", (condition) => {
    const card = entry();
    const utility = card.planning.engine.runnerUtilityLongtail;
    if (utility?.kind !== "trash_fully_broken_passed_ice")
      throw new Error("post_break_trash_test_binding_missing");
    const forged = utility as unknown as Record<string, unknown>;
    if (condition === "undefined_costs") delete forged.costs;
    if (condition === "null_cost") forged.costs = [null, utility.costs[1]];
    if (condition === "missing_cost") forged.costs = [utility.costs[0]];
    if (condition === "duplicate_cost")
      forged.costs = [utility.costs[0], utility.costs[0]];
    if (condition === "wrong_source_amount")
      forged.costs = [{ kind: "trash_source", amount: 2 }, utility.costs[1]];
    if (condition === "wrong_cost_target")
      forged.costs = [
        utility.costs[0],
        { kind: "target_rez_cost", target: "chosen_ice" },
      ];
    if (condition === "wrong_timing") forged.timing = "on_access";
    if (condition === "wrong_target") forged.target = "chosen_ice";
    if (condition === "wrong_visibility")
      forged.visibility = "hidden_info_barrier";
    expect(() => deriveCardSpecAiHint(card)).toThrow(
      "card_spec_unknown_post_pass_trash_shape",
    );
  });
});
