import type { AccessPresentationOutcomeKind } from "./access-presentation";

export type MatchOverlayPresentation = {
  concludingAgendaAccessAwaitingConfirmation: boolean;
  showAccessReveal: boolean;
  showResultModal: boolean;
};

export function matchOverlayPresentation(input: {
  accessRevealAvailable: boolean;
  accessRevealDismissed: boolean;
  accessRevealKind: string | null;
  accessOutcomeKind: AccessPresentationOutcomeKind | null;
  matchEnded: boolean;
  resultAvailable: boolean;
  resultDismissed: boolean;
  runnerWonByAgendaPoints: boolean;
}): MatchOverlayPresentation {
  const accessAwaitingConfirmation =
    input.accessRevealAvailable && !input.accessRevealDismissed;
  const concludingAgendaAccessAwaitingConfirmation =
    input.matchEnded &&
    input.runnerWonByAgendaPoints &&
    accessAwaitingConfirmation &&
    input.accessRevealKind === "access" &&
    input.accessOutcomeKind === "stolen";
  const showAccessReveal =
    accessAwaitingConfirmation &&
    (!input.matchEnded || concludingAgendaAccessAwaitingConfirmation);
  return {
    concludingAgendaAccessAwaitingConfirmation,
    showAccessReveal,
    showResultModal:
      input.resultAvailable &&
      !input.resultDismissed &&
      !concludingAgendaAccessAwaitingConfirmation,
  };
}
