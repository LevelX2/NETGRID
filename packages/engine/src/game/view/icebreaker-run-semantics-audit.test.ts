import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";
import { icebreakerAbilitiesForDefinition } from "../../ability-engine/icebreaker-abilities";

describe("icebreaker run semantics audit", () => {
  it("requires structured Engine break abilities for every active Icebreaker", () => {
    const activeBreakers = Object.values(CARD_DEFINITIONS_BY_ID).filter(
      (definition) =>
        definition.type === "program" &&
        definition.subtypes?.includes("icebreaker"),
    );
    expect(activeBreakers.length).toBeGreaterThan(0);
    for (const definition of activeBreakers) {
      const abilities = icebreakerAbilitiesForDefinition(definition);
      const breaks = abilities.filter((ability) => ability.type === "break_subroutine");
      expect(
        breaks.length,
        `${definition.title}: fehlende strukturierte Breakfähigkeit`,
      ).toBeGreaterThan(0);
      for (const ability of breaks) {
        expect(
          ability.cost.credits,
          `${definition.title}: unstrukturierte Breakkosten`,
        ).toBeTypeOf("number");
        expect(
          ability.source,
          `${definition.title}: unbekannte Ability-Quelle`,
        ).toMatch(/^(shared_card_definition|card_implementation)$/);
      }
    }
  });
});
