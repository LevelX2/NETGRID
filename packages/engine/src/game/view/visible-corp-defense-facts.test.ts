import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { visibleFortPassProtection } from "./visible-fort-pass-protection";
import { visibleRunnerPreparationIncomePerClick } from "./visible-runner-preparation-income";

function visible(id: string): VisibleCard {
  const definition = CARD_DEFINITIONS_BY_ID[id]!;
  return {
    ...definition,
    instanceId: id,
    definitionId: id,
    known: true,
    owner: definition.side,
    controller: definition.side,
  } as VisibleCard;
}
describe("visible Corp defense mechanics", () => {
  it("quotes the implemented pass trigger without drawing randomness", () => {
    const card = visible("onr_v1_367_rio-de-janeiro-city-grid");
    const before = structuredClone(card);
    expect(visibleFortPassProtection(card)).toEqual({
      complete: true,
      kind: "end_run_on_pass",
      dieFaces: 6,
      endingFaces: 1,
      activeOnInstall: true,
    });
    expect(visibleFortPassProtection(card)).toEqual(
      visibleFortPassProtection(card),
    );
    expect(card).toEqual(before);
  });
  it("distinguishes missing knowledge and a card with no pass trigger", () => {
    expect(
      visibleFortPassProtection({ instanceId: "hidden", known: false }),
    ).toMatchObject({ complete: false });
    expect(
      visibleFortPassProtection(visible("onr_v1_279_wall-of-static")),
    ).toEqual({ complete: true, kind: "none" });
  });
  it("quotes repeatable public income without assuming hidden events", () => {
    const program = visible("onr_v1_045_newsgroup-filter");
    expect(visibleRunnerPreparationIncomePerClick([program])).toBe(2);
    expect(visibleRunnerPreparationIncomePerClick([])).toBe(1);
    expect(
      visibleRunnerPreparationIncomePerClick([{ ...program, known: false }]),
    ).toBe(1);
  });
});
