import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";

import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

function cardStrategyEntry(cardId: string) {
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
      entry.definition.id.startsWith("onr_v1_"),
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
      ["onr_v1_188_ai-chief-financial-officer", "deck.corp_recycle"],
      ["onr_v1_190_bioweapons-engineering", "damage.corp_meat_amplifier"],
      ["onr_v1_194_corporate-downsizing", "hq.corp_agenda_flood_control"],
      ["onr_v1_199_employee-empowerment", "draw.corp_recurring"],
      ["onr_v1_214_project-babylon", "score.overadvance_bonus"],
      ["onr_proteus_007_project-venice", "action.corp_recurring_extra_action"],
      ["onr_v1_271_tko-2-0", "corp_ice.encounter_tax"],
      ["onr_v1_292_management-shake-up", "advance.counter_manipulation"],
      ["onr_v1_309_bbs-whispering-campaign", "economy.corp_installed_engine"],
      ["onr_v1_323_experimental-ai", "remote.ambush"],
      ["onr_v1_361_namatoki-plaza", "score.remote_capacity"],
      ["onr_v1_207_netwatch-operations-office", "tag.source"],
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
    const forged = (cardId: string, engine: Record<string, unknown>) => {
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
      forged("onr_v1_188_ai-chief-financial-officer", {
        scoredAgenda: {
          kind: "gain_credits_on_score",
          recipient: "corp",
          amount: 1,
          visibility: "public",
        },
      }),
    ).toThrow("card_spec_strategy_support_evidence_missing");

    const damageEntry = cardStrategyEntry("onr_v1_208_on-call-solo-team");
    expect(
      forged("onr_v1_208_on-call-solo-team", {
        abilities: damageEntry.planning.engine.abilities?.map((ability) => ({
          ...ability,
          condition: undefined,
        })),
      }),
    ).toThrow("card_spec_strategy_support_evidence_missing");

    const traceEntry = cardStrategyEntry(
      "onr_v1_207_netwatch-operations-office",
    );
    expect(
      forged("onr_v1_207_netwatch-operations-office", {
        abilities: traceEntry.planning.engine.abilities?.map((ability) => ({
          ...ability,
          effects: ability.effects.map((effect) =>
            effect.kind === "trace" ? { ...effect, onSuccess: [] } : effect,
          ),
        })),
      }),
    ).toThrow("card_spec_strategy_support_evidence_missing");

    expect(
      forged("onr_v1_361_namatoki-plaza", {
        fortCapacityModifiers: undefined,
      }),
    ).toThrow("card_spec_strategy_support_evidence_missing");
  });
});
