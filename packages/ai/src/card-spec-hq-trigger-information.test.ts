import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";
import { buildDeckStrategyProfile } from "./deck-doctrine-strategy";

describe("HQ access triggers preserve their actual information target (SP-615)", () => {
  const source = cardSpecPlanningCards().find(
    (card) => card.definition.id === "onr_classic_032_schematics-search-engine",
  )!;

  it.each(["canonical", "renamed"])(
    "does not invent a full HQ reveal for the %s mechanical source",
    (identity) => {
      const mechanical = { ...source.planning };
      delete mechanical.planningAnnotations;
      const hint = deriveCardSpecAiHint({
        ...source,
        definition: identity === "canonical" ? source.definition : {
          ...source.definition,
          id: "onr_v1_183_technician-lover",
          title: "Unrelated title",
        },
        planning: mechanical,
      });
      expect(hint.effects).toContainEqual({
        kind: "expose_info",
        scope: "installed_card",
        timing: "on_access",
        resource: "cards",
        target: "installed_corp_cards",
      });
      expect(hint.effects?.some((effect) => effect.kind === "hq_info")).toBe(false);
      expect(hint.functionSignals).not.toContain("access.hq_full_reveal");
      expect(hint.functionSignals).not.toContain("info.hq_information");
      expect(hint.requiredMechanics).toContain("hq_access_trigger");
    },
  );

  it("publishes only the actual expose effect in the runtime artifact", () => {
    const hint = AI_HINTS_BY_CARD.get(source.definition.id)!;
    expect(hint.effects?.some((effect) => effect.kind === "hq_info")).toBe(false);
    expect(hint.functionSignals).toContain("info.expose_installed_card");
  });

  it("feeds the corrected generated functions into the deck profile", () => {
    const profile = buildDeckStrategyProfile({
      deckSnapshotId: "real-mechanics-information-projection",
      side: "runner",
      cards: [{ cardId: source.definition.id, quantity: 2 }],
    });
    expect(profile.functionSignalCounts["info.expose_installed_card"]).toBe(2);
    expect(profile.functionSignalCounts["access.hq_full_reveal"]).toBeUndefined();
    expect(profile.functionSignalCounts["info.hq_information"]).toBeUndefined();
  });
});
