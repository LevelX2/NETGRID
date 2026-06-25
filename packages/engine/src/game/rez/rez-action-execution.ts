import type { CardInstanceId, LegalAction } from "@netgrid/shared";

export type RezActionExecutionHost = {
  rez: {
    executeRezCard: (
      cardId: CardInstanceId,
      rootRez: boolean,
      legalAction: LegalAction,
    ) => void;
    expireScoredAgendaInstallRezCreditAbilities: () => void;
  };
  run: {
    passCorpRunRootRezWindow: (legalAction: LegalAction) => void;
    passApproachedIce: () => void;
  };
};

export type RezActionExecutionResult = {
  handled: boolean;
};

export function handleRezActionExecution(
  host: RezActionExecutionHost,
  legalAction: LegalAction,
): RezActionExecutionResult {
  switch (legalAction.type) {
    case "rez_ice":
      executeRezIceAction(host, legalAction);
      return { handled: true };
    case "decline_rez":
      executeDeclineRezAction(host, legalAction);
      return { handled: true };
    default:
      return { handled: false };
  }
}

function executeRezIceAction(
  host: RezActionExecutionHost,
  legalAction: LegalAction,
): void {
  host.rez.executeRezCard(
    String(legalAction.payload?.cardId) as CardInstanceId,
    legalAction.payload?.rootRez === true || legalAction.payload?.assetRez === true,
    legalAction,
  );
  host.rez.expireScoredAgendaInstallRezCreditAbilities();
}

function executeDeclineRezAction(
  host: RezActionExecutionHost,
  legalAction: LegalAction,
): void {
  if (legalAction.payload?.runRootRezPass === true) {
    host.run.passCorpRunRootRezWindow(legalAction);
    return;
  }
  host.run.passApproachedIce();
}
