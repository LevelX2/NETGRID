import type { CardInstanceId, GameState, LegalAction, ServerId } from "@netgrid/shared";

export type StartRunActionExecutionHost = {
  state: GameState;
  payment: {
    spendRunnerClick: () => void;
    payRunStartTaxCredits: (legalAction: LegalAction) => void;
  };
  turn: {
    ensureRunnerTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
  };
  run: {
    validateRovingSubmarineRunGate: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => void;
    startRun: (
      serverId: Exclude<ServerId, "new_remote">,
      legalAction: LegalAction,
    ) => void;
    activeWilsonSourceIds: () => CardInstanceId[];
  };
};

export type StartRunActionExecutionResult = {
  handled: boolean;
};

export function handleStartRunActionExecution(
  host: StartRunActionExecutionHost,
  legalAction: LegalAction,
): StartRunActionExecutionResult {
  if (legalAction.type !== "start_run") return { handled: false };
  executeStartRunAction(host, legalAction);
  return { handled: true };
}

export function executeStartRunAction(
  host: StartRunActionExecutionHost,
  legalAction: LegalAction,
): void {
  const serverId = String(legalAction.payload?.serverId) as Exclude<
    ServerId,
    "new_remote"
  >;
  host.run.validateRovingSubmarineRunGate(serverId);
  if (legalAction.payload?.bonusRunNoClick === true) {
    host.turn.ensureRunnerTurnFlags().allNighterBonusRunPending = false;
    host.turn.ensureRunnerTurnFlags().bodyweightDataCrecheExtraRunPending = false;
  } else {
    host.payment.spendRunnerClick();
  }
  if (legalAction.payload?.wilsonRunOnlyAction === true) {
    const flags = host.turn.ensureRunnerTurnFlags();
    const remaining = Math.max(
      0,
      Math.floor(flags.wilsonRunOnlyActionsRemaining ?? 0),
    );
    if (remaining <= 0)
      throw new Error("Es ist keine Wilson-Run-Aktion verfuegbar.");
    flags.wilsonRunOnlyActionsRemaining = remaining - 1;
  }
  host.run.startRun(serverId, legalAction);
  if (legalAction.payload?.wilsonRunOnlyAction === true && host.state.run) {
    const sourceCardId = host.run.activeWilsonSourceIds()[0];
    host.state.run.wilsonRunSpendingCap = {
      sourceCardInstanceId: sourceCardId ?? ("" as CardInstanceId),
      limit: 3,
      spent: 0,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runSpendingCap: 3,
      runSpendingCapSpent: 0,
      wilsonRunSpendingCapActive: true,
    };
  }
  host.payment.payRunStartTaxCredits(legalAction);
}
