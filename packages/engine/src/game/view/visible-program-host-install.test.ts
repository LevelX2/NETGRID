import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import type { VisibleCard } from "@netgrid/shared";
import { visibleProgramHostInstallVariants } from "./visible-program-host-install";

function card(id: string, instanceId = id): VisibleCard {
  const definition = CARD_DEFINITIONS_BY_ID[id]!;
  return {
    ...definition,
    instanceId,
    definitionId: definition.id,
    known: true,
    owner: "runner",
    strength: definition.strength,
  } as VisibleCard;
}
describe("public program host install projection", () => {
  it("quotes Afreet's separate memory and the hosted breaker's reduced strength", () => {
    const host = card("onr_v1_001_afreet");
    const program = card("onr_v1_016_cyfermaster");
    const quote = visibleProgramHostInstallVariants(program, [host]);
    expect(quote).toMatchObject({
      complete: true,
      cards: [
        {
          instanceId: program.instanceId,
          hostedOn: host.instanceId,
          strength: program.strength! - 1,
        },
      ],
    });
    expect(program.hostedOn).toBeUndefined();
  });
  it("rejects full hosts, nested hosts and unknown occupancy", () => {
    const host = card("onr_v1_001_afreet");
    const program = card("onr_v1_016_cyfermaster");
    const occupant = {
      ...program,
      instanceId: "occupant",
      hostedOn: host.instanceId,
      memoryCost: 3,
    } as VisibleCard;
    expect(
      visibleProgramHostInstallVariants(program, [host, occupant]),
    ).toEqual({ complete: true, cards: [] });
    expect(
      visibleProgramHostInstallVariants(program, [
        { ...host, hostedOn: "outer" } as VisibleCard,
      ]),
    ).toEqual({ complete: true, cards: [] });
    const unknownOccupant = { ...occupant };
    delete unknownOccupant.memoryCost;
    expect(
      visibleProgramHostInstallVariants(program, [host, unknownOccupant]),
    ).toMatchObject({ complete: false });
  });
});
