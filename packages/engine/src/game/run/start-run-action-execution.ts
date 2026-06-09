import type {
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import type { StartRunOptions } from "./run-core-execution";

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
    validateActivityGatedFortRun: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => void;
    startRun: (
      serverId: Exclude<ServerId, "new_remote">,
      legalAction: LegalAction,
      options?: StartRunOptions,
    ) => void;
    activeRunActionSpendingCapSourceIds: () => CardInstanceId[];
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
  const flags = host.turn.ensureRunnerTurnFlags();
  const pirateBroadcastNextServerId =
    flags.pirateBroadcastPending?.pendingServerIds[0];
  if (pirateBroadcastNextServerId) {
    if (
      legalAction.payload?.pirateBroadcastRun !== true ||
      legalAction.payload?.bonusRunNoClick !== true
    )
      throw new Error("Pirate Broadcast erzwingt den nächsten Data-Fort-Run.");
    if (serverId !== pirateBroadcastNextServerId)
      throw new Error("Pirate Broadcast verlangt den nächsten Data Fort.");
    if (
      legalAction.payload?.bonusRunSource !==
      flags.pirateBroadcastPending?.sourceDefinitionId
    )
      throw new Error("Die Pirate-Broadcast-Quelle passt nicht zur Sequenz.");
  } else if (legalAction.payload?.pirateBroadcastRun === true) {
    throw new Error("Es ist keine Pirate-Broadcast-Sequenz offen.");
  }
  host.run.validateActivityGatedFortRun(serverId);
  let runOnlyActionSourceCardId: CardInstanceId | undefined;
  if (legalAction.payload?.runOnlyAction === true) {
    const explicitSourceCardId = String(
      legalAction.payload?.runOnlyActionSourceCardId ??
        legalAction.payload?.cardId ??
        "",
    ) as CardInstanceId;
    if (!explicitSourceCardId)
      throw new Error("Diese Run-Aktion benoetigt eine installierte Quelle.");
    const activeRunActionSpendingCapSourceIds =
      host.run.activeRunActionSpendingCapSourceIds();
    if (!activeRunActionSpendingCapSourceIds.includes(explicitSourceCardId))
      throw new Error("Die Quelle dieser Run-Aktion ist nicht installiert.");
    const used = flags.runOnlyActionUsedSourceIdsThisTurn ?? [];
    if (used.includes(explicitSourceCardId))
      throw new Error("Diese Run-Aktion wurde diesen Zug bereits genutzt.");
    flags.runOnlyActionUsedSourceIdsThisTurn = [
      ...used,
      explicitSourceCardId,
    ].sort();
    host.state.runner.clicks += 1;
    runOnlyActionSourceCardId = explicitSourceCardId;
  }
  if (legalAction.payload?.bonusRunNoClick === true) {
    if (legalAction.payload?.pirateBroadcastRun !== true) {
      flags.allNighterBonusRunPending = false;
      flags.bodyweightDataCrecheExtraRunPending = false;
    }
  } else {
    host.payment.spendRunnerClick();
  }
  const startRunOptions =
    legalAction.payload?.pirateBroadcastRun === true &&
    flags.pirateBroadcastPending
      ? { pirateBroadcast: flags.pirateBroadcastPending }
      : undefined;
  host.run.startRun(serverId, legalAction, startRunOptions);
  if (legalAction.payload?.runOnlyAction === true && host.state.run) {
    if (!runOnlyActionSourceCardId)
      throw new Error("Diese Run-Aktion benoetigt eine installierte Quelle.");
    const sourceCardId = runOnlyActionSourceCardId;
    host.state.run.runActionSpendingCap = {
      sourceCardInstanceId: sourceCardId,
      limit: 3,
      spent: 0,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runOnlyActionSourceCardId: sourceCardId,
      runSpendingCap: 3,
      runSpendingCapSpent: 0,
      runActionSpendingCapActive: true,
    };
  }
  host.payment.payRunStartTaxCredits(legalAction);
}
