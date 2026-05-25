import type {
  ApplyActionOptions,
  EngineError,
  EngineResult,
  GameEvent,
  GameState,
  LegalAction,
  PlayerAction,
  PublicGameEvent,
  Side,
  StateHash,
  ValidationResult,
} from "@netgrid/shared";

export type ApplyActionCoreHost = {
  legalActions: {
    getLegalActions: (state: GameState, side: Side) => LegalAction[];
  };
  choices: {
    validateChoiceAction: (
      choice: GameState["pendingChoice"],
      legalAction: LegalAction,
      playerAction: PlayerAction,
    ) => string | undefined;
  };
  state: {
    cloneGameStateForAction: (state: GameState) => GameState;
  };
  actions: {
    performAction: (
      state: GameState,
      legalAction: LegalAction,
      playerAction: PlayerAction,
    ) => void;
  };
  win: {
    checkWinConditions: (state: GameState) => unknown;
  };
  validation: {
    validateGameState: (state: GameState) => ValidationResult;
  };
  hash: {
    hashState: (state: GameState) => StateHash;
  };
  events: {
    buildEvent: (
      before: number,
      after: number,
      stateHashAfter: StateHash,
      previousState: GameState,
      state: GameState,
      legalAction: LegalAction,
      playerAction: PlayerAction,
    ) => GameEvent;
    toPublicEvent: (event: GameEvent) => PublicGameEvent;
  };
};

let defaultApplyActionCoreHost: ApplyActionCoreHost | undefined;

export function configureApplyActionCoreHost(
  host: ApplyActionCoreHost | undefined,
): ApplyActionCoreHost | undefined {
  const previous = defaultApplyActionCoreHost;
  defaultApplyActionCoreHost = host;
  return previous;
}

export function applyAction(
  state: GameState,
  playerAction: PlayerAction,
  options: ApplyActionOptions = {},
): EngineResult {
  if (!defaultApplyActionCoreHost)
    throw new Error("ApplyActionCore-Host ist nicht initialisiert.");
  return buildApplyAction(defaultApplyActionCoreHost, state, playerAction, options);
}

export function buildApplyAction(
  host: ApplyActionCoreHost,
  state: GameState,
  playerAction: PlayerAction,
  options: ApplyActionOptions = {},
): EngineResult {
  if (playerAction.matchId !== state.matchId) {
    return fail(
      state,
      "ERR_INVALID_TARGET",
      "Diese Aktion gehört nicht zu diesem Spiel.",
    );
  }
  if (playerAction.clientKnownStateVersion !== state.stateVersion) {
    return fail(
      state,
      "ERR_STALE_STATE",
      "Der Spielzustand ist veraltet. Bitte aktualisiere die Ansicht.",
    );
  }

  const legalActions = host.legalActions.getLegalActions(state, playerAction.side);
  const legalAction = legalActions.find(
    (candidate) => candidate.actionId === playerAction.actionId,
  );
  if (!legalAction) {
    return fail(
      state,
      playerAction.side === state.activeSide
        ? "ERR_UNKNOWN_ACTION"
        : "ERR_WRONG_SIDE",
      "Diese Aktion ist im aktuellen Fenster nicht legal.",
    );
  }

  const choiceError = host.choices.validateChoiceAction(
    state.pendingChoice,
    legalAction,
    playerAction,
  );
  if (choiceError) return fail(state, "ERR_INVALID_CHOICE", choiceError);

  const next = host.state.cloneGameStateForAction(state);
  const before = state.stateVersion;

  try {
    host.actions.performAction(next, legalAction, playerAction);
    host.win.checkWinConditions(next);
    next.stateVersion = before + 1;
    const validation = host.validation.validateGameState(next);
    if (!validation.ok) {
      return fail(
        state,
        "ERR_INVARIANT_FAILED",
        `Der Spielzustand ist ungültig: ${validation.errors[0] ?? "unbekannter Fehler"}`,
      );
    }
  } catch (error) {
    return fail(
      state,
      "ERR_INVALID_TARGET",
      error instanceof Error
        ? error.message
        : "Die Aktion konnte nicht ausgeführt werden.",
    );
  }

  const stateHash = host.hash.hashState(next);
  const event = host.events.buildEvent(
    before,
    next.stateVersion,
    stateHash,
    state,
    next,
    legalAction,
    playerAction,
  );
  next.eventLog.push(event);

  return {
    ok: true,
    state: next,
    event,
    publicEvents:
      options.publicEventsMode === "latest"
        ? [host.events.toPublicEvent(event)]
        : next.eventLog.map(host.events.toPublicEvent),
    stateHash,
  };
}

function fail(
  state: GameState,
  code: EngineError["code"],
  message: string,
): EngineResult {
  return { ok: false, error: { code, message }, state };
}
