import type {
  CardInstanceId,
  GameState,
  LegalAction,
  MultiServerSuccessSequenceState,
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
  const pendingSequence = nextMultiServerSuccessSequence(flags);
  const nextSequenceServerId = pendingSequence?.pendingServerIds[0];
  if (pendingSequence && nextSequenceServerId) {
    if (
      legalAction.payload?.multiServerSuccessSequenceRun !== true ||
      legalAction.payload?.bonusRunNoClick !== true
    )
      throw new Error(
        "Die offene Run-Sequenz erzwingt den naechsten Data-Fort-Run.",
      );
    if (serverId !== nextSequenceServerId)
      throw new Error(
        "Die offene Run-Sequenz verlangt den naechsten Data Fort.",
      );
    if (
      legalAction.payload?.bonusRunSource !==
      pendingSequence.sourceDefinitionId
    )
      throw new Error("Die Sequenzquelle passt nicht zur offenen Run-Sequenz.");
  } else if (legalAction.payload?.multiServerSuccessSequenceRun === true) {
    throw new Error("Es ist keine passende Run-Sequenz offen.");
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
    if (legalAction.payload?.multiServerSuccessSequenceRun !== true) {
      flags.bonusRunPending = false;
      flags.successfulRunExtraRunPending = false;
    }
  } else {
    host.payment.spendRunnerClick();
  }
  const startRunOptions =
    legalAction.payload?.multiServerSuccessSequenceRun === true &&
    pendingSequence
      ? { activeSequence: pendingSequence }
      : undefined;
  host.run.startRun(serverId, legalAction, startRunOptions);
  host.payment.payRunStartTaxCredits(legalAction);
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
}

function nextMultiServerSuccessSequence(
  flags: NonNullable<GameState["runnerTurnFlags"]>,
): MultiServerSuccessSequenceState | undefined {
  return flags.pendingSequences?.find(
    (sequence) =>
      sequence.kind === "multi_server_success_sequence" &&
      sequence.pendingServerIds.length > 0,
  );
}
