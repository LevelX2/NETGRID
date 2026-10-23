import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

function source(id: string) {
  const entry = cardSpecPlanningCards().find((card) => card.definition.id === id);
  if (entry === undefined) throw new Error(`scored_recycle_test_source_missing:${id}`);
  return entry;
}

describe("scored agenda recycling timing", () => {
  it("requires a later repeatable scored action for recycling and drawing", () => {
    const entry = source("onr_v1_188_ai-chief-financial-officer");
    expect(entry.planning.engine.scoredAgenda?.kind).toBe(
      "shuffle_hq_archives_into_rd_then_draw",
    );
    for (const hint of [deriveCardSpecAiHint(entry), AI_HINTS_BY_CARD.get(entry.definition.id)!]) {
      const effects = hint.effects!.filter((effect) =>
        ["zone_shuffle", "draw", "scored_agenda_action"].includes(effect.kind),
      );
      expect(effects).toHaveLength(3);
      expect(effects.every((effect) =>
        effect.timing === "scored_activated" && effect.repeatable === true && effect.finite === false,
      )).toBe(true);
      expect(effects).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "draw", amount: 5 }),
        expect.objectContaining({ kind: "zone_shuffle", target: "score.shuffle_hq_archives_into_rnd" }),
      ]));
      expect(hint.functionSignals).toContain("score.scored_agenda_action");
      expect(hint.effects!.some((effect) => effect.timing === "when_scored")).toBe(false);
    }
  });

  it("derives the timing from the typed mechanic independently of the card title", () => {
    const entry = source("onr_v1_188_ai-chief-financial-officer");
    const renamed = { ...entry, definition: { ...entry.definition, title: "Scored recycle test" } };
    expect(deriveCardSpecAiHint(renamed).effects).toEqual(deriveCardSpecAiHint(entry).effects);
  });

  it("keeps an actual automatic score payout automatic", () => {
    const hint = deriveCardSpecAiHint(source("onr_v1_203_hostile-takeover"));
    expect(hint.effects).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "economy", timing: "when_scored", amount: 5 }),
    ]));
    expect(hint.functionSignals).not.toContain("score.scored_agenda_action");
  });
});
