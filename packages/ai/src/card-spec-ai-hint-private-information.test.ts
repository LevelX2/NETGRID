import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { describe, expect, it } from "vitest";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

describe("private information capability translation", () => {
  it.each([
    [
      "onr_classic_046_executive-file-clerk",
      "hq",
      "hq_info",
      "full_reveal",
      undefined,
      true,
    ],
    [
      "onr_classic_050_sandbox-dig",
      "rnd",
      "topdeck_info",
      "top_cards",
      3,
      true,
    ],
    [
      "onr_v1_183_technician-lover",
      "rnd",
      "topdeck_info",
      "top_cards",
      1,
      false,
    ],
  ] as const)(
    "projects the exact typed capability of %s",
    (id, scope, kind, target, amount, consumed) => {
      const entry = cardSpecPlanningCards().find(
        (card) => card.definition.id === id,
      )!;
      const mechanical = { ...entry.planning };
      delete mechanical.planningAnnotations;
      const hint = deriveCardSpecAiHint({ ...entry, planning: mechanical });
      const expected = {
        kind,
        scope,
        timing: "action",
        resource: "cards",
        target,
        ...(amount === undefined ? {} : { amount }),
        ...(consumed ? { finite: true } : { repeatable: true }),
      };
      const ability = entry.planning.engine.abilities!.find((a) =>
        a.effects?.some((e) => e.kind === "private_look"),
      )!;
      const capability = hint.actionCapabilitySemantics!.find(
        (a) => a.capabilityKey === ability.capabilityKey,
      )!;
      expect(capability.effects).toContainEqual(expected);
      expect(
        hint.effects!.filter(
          (effect) => effect.kind === kind && effect.scope === scope,
        ),
      ).toEqual([expected]);
    },
  );

  it("does not infer information from a sibling capability or the card identity", () => {
    const entry = cardSpecPlanningCards().find(
      (card) => card.definition.id === "onr_classic_050_sandbox-dig",
    )!;
    const ability = entry.planning.engine.abilities![0]!;
    const hint = deriveCardSpecAiHint({
      ...entry,
      definition: {
        ...entry.definition,
        id: "onr_v1_183_technician-lover",
        title: "Renamed witness",
        rulesText: "Unrelated text",
      },
      planning: {
        ...entry.planning,
        planningAnnotations: undefined,
        engine: {
          ...entry.planning.engine,
          abilities: [
            ability,
            {
              ...ability,
              capabilityKey: "non_information_sibling",
              costs: [],
              effects: [
                {
                  kind: "gain_credits",
                  amount: 1,
                  recipient: "controller",
                  visibility: "public",
                },
              ],
            },
          ],
        },
      },
    } as never);
    expect(
      hint.actionCapabilitySemantics!.find(
        (a) => a.capabilityKey === ability.capabilityKey,
      )!.effects,
    ).toContainEqual(
      expect.objectContaining({
        kind: "topdeck_info",
        scope: "rnd",
        amount: 3,
        finite: true,
      }),
    );
    expect(
      hint
        .actionCapabilitySemantics!.find(
          (a) => a.capabilityKey === "non_information_sibling",
        )!
        .effects!.some((effect) => effect.kind === "topdeck_info"),
    ).toBe(false);
  });
});
