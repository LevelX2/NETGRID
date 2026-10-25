import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { visibleFortPassProtection } from "./visible-fort-pass-protection";
import {
  visibleRunnerPreparationIncomePerClick,
  visibleRunnerNextTurnPreparationCreditGain,
} from "./visible-runner-preparation-income";

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

function bank(id: string, amount: number): VisibleCard {
  return {
    ...visible("onr_v1_154_broker"),
    instanceId: id,
    rezzed: true,
    counters: { bit: amount },
  };
}
describe("public next-turn bank preparation", () => {
  it("replaces a basic click with the native three-credit payout", () => {
    expect(visibleRunnerNextTurnPreparationCreditGain([bank("b", 3)], 3)).toBe(
      5,
    );
  });
  it("uses separate sources only once within the available actions", () => {
    const rig = [bank("a", 3), bank("b", 6), bank("c", 9)];
    expect(visibleRunnerNextTurnPreparationCreditGain(rig, 2)).toBe(15);
    expect(visibleRunnerNextTurnPreparationCreditGain(rig, 3)).toBe(18);
    expect(visibleRunnerNextTurnPreparationCreditGain(rig, 4)).toBe(19);
  });
  it("does not turn newly loaded or empty pools into same-turn cash", () => {
    expect(visibleRunnerNextTurnPreparationCreditGain([bank("b", 0)], 3)).toBe(
      3,
    );
    expect(visibleRunnerNextTurnPreparationCreditGain([bank("b", 9)], 0)).toBe(
      0,
    );
  });
  it("keeps public income policy and excludes hidden or uncontrolled pools", () => {
    expect(
      visibleRunnerNextTurnPreparationCreditGain([bank("b", 3)], 3, 2),
    ).toBe(7);
    expect(
      visibleRunnerNextTurnPreparationCreditGain(
        [{ ...bank("b", 9), known: false }],
        3,
      ),
    ).toBe(3);
    expect(
      visibleRunnerNextTurnPreparationCreditGain(
        [{ ...bank("b", 9), controller: "corp" }],
        3,
      ),
    ).toBe(3);
  });
  it("fails closed on invalid counters and duplicate public sources", () => {
    expect(() =>
      visibleRunnerNextTurnPreparationCreditGain([bank("b", -1)], 3),
    ).toThrow("invalid_visible_runner_preparation_bank_counter");
    expect(() =>
      visibleRunnerNextTurnPreparationCreditGain(
        [bank("b", 3), bank("b", 6)],
        3,
      ),
    ).toThrow("duplicate_visible_runner_preparation_bank");
  });
});
