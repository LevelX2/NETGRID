import type { CardDefinitionId } from "@netgrid/shared";
import { ORIGINALSET_V1_CARD_IDS } from "@netgrid/catalog";
import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

function cardStrategyEntry(cardId: CardDefinitionId) {
  const entry = cardSpecPlanningCards().find(
    (candidate) => candidate.definition.id === cardId,
  );
  if (entry === undefined) throw new Error(`missing_test_card:${cardId}`);
  return {
    ...entry,
    planning: {
      ...entry.planning,
      planningAnnotations: {
        schemaVersion: "card-planning-annotations-v1" as const,
        card:
          entry.planning.planningAnnotations?.card?.filter(
            (annotation) => annotation.kind === "strategy_support",
          ) ?? [],
        capabilities: [],
      },
    },
  };
}

describe("CardSpec card-level strategy typed evidence", () => {
  it("compiles all 148 Originalset bindings from typed Engine evidence", () => {
    const entries = cardSpecPlanningCards().filter((entry) =>
      ORIGINALSET_V1_CARD_IDS.includes(entry.definition.id),
    );
    expect(
      entries.reduce(
        (count, entry) =>
          count +
          (entry.planning.planningAnnotations?.card?.filter(
            (annotation) => annotation.kind === "strategy_support",
          ).length ?? 0),
        0,
      ),
    ).toBe(148);

    for (const entry of entries) {
      if (
        !entry.planning.planningAnnotations?.card?.some(
          (annotation) => annotation.kind === "strategy_support",
        )
      )
        continue;
      expect(() =>
        deriveCardSpecAiHint(cardStrategyEntry(entry.definition.id)),
      ).not.toThrow();
    }
  });

  it("covers every missing card-level strategy cluster with a typed witness", () => {
    const witnesses = [
      [400, "deck.corp_recycle"],
      [402, "damage.corp_meat_amplifier"],
      [406, "hq.corp_agenda_flood_control"],
      [411, "draw.corp_recurring"],
      [426, "score.overadvance_bonus"],
      [65, "action.corp_recurring_extra_action"],
      [483, "corp_ice.encounter_tax"],
      [504, "advance.counter_manipulation"],
      [521, "economy.corp_installed_engine"],
      [535, "remote.ambush"],
      [573, "score.remote_capacity"],
      [419, "tag.source"],
    ] as const;

    for (const [cardId, evidence] of witnesses)
      expect(
        deriveCardSpecAiHint(cardStrategyEntry(cardId)).strategySupportPairs,
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            evidence: expect.arrayContaining([evidence]),
          }),
        ]),
      );
  });

  it("rejects near-matching mechanics without the asserted strategy evidence", () => {
    const forged = (cardId: CardDefinitionId, engine: Record<string, unknown>) => {
      const entry = cardStrategyEntry(cardId);
      return () =>
        deriveCardSpecAiHint({
          ...entry,
          planning: {
            ...entry.planning,
            engine: { ...entry.planning.engine, ...engine },
          },
        } as never);
    };

    expect(
      forged(400, {
        scoredAgenda: {
          kind: "gain_credits_on_score",
          recipient: "corp",
          amount: 1,
          visibility: "public",
        },
      }),
    ).toThrow("card_spec_strategy_support_evidence_missing");

    const damageEntry = cardStrategyEntry(420);
    expect(
      forged(420, {
        abilities: damageEntry.planning.engine.abilities?.map((ability) => ({
          ...ability,
          condition: undefined,
        })),
      }),
    ).toThrow("card_spec_strategy_support_evidence_missing");

    const traceEntry = cardStrategyEntry(
      419,
    );
    expect(
      forged(419, {
        abilities: traceEntry.planning.engine.abilities?.map((ability) => ({
          ...ability,
          effects: ability.effects.map((effect) =>
            effect.kind === "trace" ? { ...effect, onSuccess: [] } : effect,
          ),
        })),
      }),
    ).toThrow("card_spec_strategy_support_evidence_missing");

    expect(
      forged(573, {
        fortCapacityModifiers: undefined,
      }),
    ).toThrow("card_spec_strategy_support_evidence_missing");
  });
});
