import type {
  ApplyActionOptions,
  EngineError,
  EngineResult,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { validateChoiceAction } from "./choices/choice-validation";
import { buildEvent } from "./events/build-event";
import { getLegalActions } from "./legal-actions";
import { cloneGameStateForAction } from "./apply-action-state";
import { hashState } from "./hash";
import { validateGameState } from "./validation";
import { toPublicEvent } from "./view/public-event-view";
import { checkWinConditions } from "./win-conditions";

export type ApplyActionCoreHost = {
  actions: {
    performAction: (
      state: GameState,
      legalAction: LegalAction,
      playerAction: PlayerAction,
    ) => void;
    afterPerformAction?: (state: GameState, legalAction: LegalAction) => void;
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
  return buildApplyAction(
    defaultApplyActionCoreHost,
    state,
    playerAction,
    options,
  );
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

  const legalActions = getLegalActions(state, playerAction.side);
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

  const choiceError = validateChoiceAction(
    state.pendingChoice,
    legalAction,
    playerAction,
  );
  if (choiceError) return fail(state, "ERR_INVALID_CHOICE", choiceError);

  const next = cloneGameStateForAction(state);
  const before = state.stateVersion;

  try {
    host.actions.performAction(next, legalAction, playerAction);
    host.actions.afterPerformAction?.(next, legalAction);
    checkWinConditions(next);
    next.stateVersion = before + 1;
    if (next.pendingChoice) {
      next.pendingChoice.stateVersion = next.stateVersion;
      const continuation = choiceContinuation(next.pendingChoice, legalAction);
      if (continuation) next.pendingChoice.continuation = continuation;
      else delete next.pendingChoice.continuation;
    }
    const validation = validateGameState(next);
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

  const stateHash = hashState(next);
  const event = buildEvent(
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
        ? [toPublicEvent(event)]
        : next.eventLog.map(toPublicEvent),
    stateHash,
  };
}

function choiceContinuation(
  choice: NonNullable<GameState["pendingChoice"]>,
  legalAction: LegalAction,
): NonNullable<GameState["pendingChoice"]>["continuation"] | undefined {
  if (choice.side === "runner") {
    const continuation = choice.continuation;
    if (
      continuation?.family === "runner_hidden_draw_keep_or_top_replacement" &&
      legalAction.side === "runner" &&
      legalAction.actionId.length > 0 &&
      continuation.originActionId.length === 0 &&
      continuation.createdAtStateVersion === choice.stateVersion &&
      choice.sourceCardInstanceId === continuation.sourceCardInstanceId &&
      choice.sourceCardDefinitionId === continuation.sourceCardDefinitionId &&
      continuation.sourceCardInstanceId.length > 0 &&
      continuation.sourceCardDefinitionId.length > 0 &&
      continuation.drawnCardInstanceIds.length > 0 &&
      new Set(continuation.drawnCardInstanceIds).size ===
        continuation.drawnCardInstanceIds.length &&
      choice.kind === "select_option" &&
      choice.visibility === "hidden_info_barrier" &&
      choice.minSelections === 1 &&
      choice.maxSelections === 1 &&
      exactHiddenDrawChoiceOptions(
        choice.options,
        continuation.drawnCardInstanceIds,
      )
    ) {
      return {
        ...continuation,
        originActionId: legalAction.actionId,
      };
    }
    if (
      continuation?.family === "runner_grip_install_with_temporary_credits" &&
      legalAction.side === "runner" &&
      legalAction.type === "play_event" &&
      legalAction.payload?.cardId === continuation.sourceCardInstanceId &&
      continuation.originActionId === legalAction.actionId &&
      continuation.createdAtStateVersion === choice.stateVersion &&
      continuation.sourceCardInstanceId.length > 0 &&
      continuation.sourceCardDefinitionId.length > 0 &&
      continuation.sourceCapabilityKey.length > 0 &&
      Number.isSafeInteger(continuation.temporaryCredits) &&
      continuation.temporaryCredits > 0 &&
      continuation.allowedTypes.length > 0 &&
      new Set(continuation.allowedTypes).size ===
        continuation.allowedTypes.length
    )
      return continuation;
    return undefined;
  }
  if (choice.side !== "corp") return undefined;
  if (
    choice.source.startsWith("p3_34.distribute_advancement:") ||
    choice.source.startsWith("p3_34.move_advancement:")
  ) {
    return {
      family: "corp_advancement_counter",
      originActionId: legalAction.actionId,
      createdAtStateVersion: choice.stateVersion,
    };
  }
  const sourceParts = choice.source.split(":");
  const agendaInstanceId = sourceParts[1];
  const creditPerAgendaPoint = Number(sourceParts[2]);
  if (
    sourceParts.length !== 4 ||
    sourceParts[0] !== "scored_agenda.hq_agenda_shuffle_credits" ||
    legalAction.type !== "score_agenda" ||
    agendaInstanceId === undefined ||
    legalAction.source !== agendaInstanceId ||
    legalAction.payload?.cardId !== agendaInstanceId ||
    !Number.isSafeInteger(creditPerAgendaPoint) ||
    creditPerAgendaPoint <= 0 ||
    String(creditPerAgendaPoint) !== sourceParts[2]
  ) {
    return undefined;
  }
  return {
    family: "corp_scored_agenda_hq_shuffle",
    originActionId: legalAction.actionId,
    agendaInstanceId,
    creditPerAgendaPoint,
    createdAtStateVersion: choice.stateVersion,
  };
}

function exactHiddenDrawChoiceOptions(
  options: NonNullable<GameState["pendingChoice"]>["options"],
  drawnCardInstanceIds: readonly string[],
): boolean {
  if (options.length !== drawnCardInstanceIds.length * 2) return false;
  const expected = new Set(
    drawnCardInstanceIds.flatMap((cardId) => [
      `${cardId}:trash`,
      `${cardId}:top`,
    ]),
  );
  const values = options.map((option) => option.value);
  return (
    values.every((value): value is string => typeof value === "string") &&
    new Set(values).size === values.length &&
    values.every((value) => expected.has(value))
  );
}

function fail(
  state: GameState,
  code: EngineError["code"],
  message: string,
): EngineResult {
  return { ok: false, error: { code, message }, state };
}
