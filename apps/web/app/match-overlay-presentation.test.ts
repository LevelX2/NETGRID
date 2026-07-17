import { describe, expect, it } from "vitest";
import { matchOverlayPresentation } from "./match-overlay-presentation";

describe("match overlay presentation", () => {
  it("shows a winning agenda access before the result modal", () => {
    expect(matchOverlayPresentation(winningAgendaInput())).toEqual({
      concludingAgendaAccessAwaitingConfirmation: true,
      showAccessReveal: true,
      showResultModal: false,
    });
  });

  it("releases the unchanged result after local access confirmation", () => {
    expect(
      matchOverlayPresentation(
        winningAgendaInput({ accessRevealDismissed: true }),
      ),
    ).toEqual({
      concludingAgendaAccessAwaitingConfirmation: false,
      showAccessReveal: false,
      showResultModal: true,
    });
    expect(
      matchOverlayPresentation(
        winningAgendaInput({
          accessRevealDismissed: true,
          resultDismissed: true,
        }),
      ).showResultModal,
    ).toBe(false);
  });

  it("keeps ordinary result and non-winning access behavior", () => {
    expect(
      matchOverlayPresentation(
        winningAgendaInput({
          accessRevealAvailable: false,
          accessOutcomeKind: null,
        }),
      ).showResultModal,
    ).toBe(true);
    expect(
      matchOverlayPresentation(
        winningAgendaInput({
          matchEnded: false,
          resultAvailable: false,
          runnerWonByAgendaPoints: false,
        }),
      ),
    ).toMatchObject({
      showAccessReveal: true,
      showResultModal: false,
    });
  });

  it("does not delay other game endings or non-access reveal windows", () => {
    expect(
      matchOverlayPresentation(
        winningAgendaInput({ runnerWonByAgendaPoints: false }),
      ).showResultModal,
    ).toBe(true);
    expect(
      matchOverlayPresentation(
        winningAgendaInput({ accessRevealKind: "archives_reveal" }),
      ).showResultModal,
    ).toBe(true);
  });
});

function winningAgendaInput(
  overrides: Partial<Parameters<typeof matchOverlayPresentation>[0]> = {},
): Parameters<typeof matchOverlayPresentation>[0] {
  return {
    accessRevealAvailable: true,
    accessRevealDismissed: false,
    accessRevealKind: "access",
    accessOutcomeKind: "stolen",
    matchEnded: true,
    resultAvailable: true,
    resultDismissed: false,
    runnerWonByAgendaPoints: true,
    ...overrides,
  };
}
