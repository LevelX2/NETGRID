import { isMatchEventId } from "@netgrid/shared";
import type {
  ApplyActionOptions,
  EngineError,
  EngineResult,
  EngineRandomizedIceInstallSelectionCommand,
  EngineRandomizedIceInstallSelectionResult,
  EngineRandomizedTurnPlanSelectionCommand,
  EngineRandomizedTurnPlanSelectionResult,
  EngineRandomizedTraceBidSelectionCommand,
  EngineRandomizedTraceBidSelectionResult,
  GameEvent,
  GameState,
  PlayerAction,
  ReplayResult,
  Side,
  StateHash,
} from "@netgrid/shared";
import {
  isReplayCompatibilityActionPayload,
  isReplayRandomizedIceInstallSelectionCommand,
  isReplayRandomizedTurnPlanSelectionCommand,
  isReplayRandomizedTraceBidSelectionCommand,
} from "../compatibility/payload-compatibility";
import { hashState } from "./hash";
import { sanitizeEventPayloadForSurface } from "./view/surface-policy";

export type ReplayHost = {
  actions: {
    applyAction: (
      state: GameState,
      action: PlayerAction,
      options: ApplyActionOptions,
    ) => EngineResult;
    applyRandomizedIceInstallSelection?: (
      state: GameState,
      command: EngineRandomizedIceInstallSelectionCommand,
      options: ApplyActionOptions,
    ) => EngineRandomizedIceInstallSelectionResult;
    applyRandomizedTurnPlanSelection?: (
      state: GameState,
      command: EngineRandomizedTurnPlanSelectionCommand,
      options: ApplyActionOptions,
    ) => EngineRandomizedTurnPlanSelectionResult;
    applyRandomizedTraceBidSelection?: (
      state: GameState,
      command: EngineRandomizedTraceBidSelectionCommand,
      options: ApplyActionOptions,
    ) => EngineRandomizedTraceBidSelectionResult;
  };
};

type ReplayEventFailureReason =
  | EngineError["code"]
  | "invalid_match_event_id"
  | "unexpected_game_creation"
  | "invalid_state_version_transition"
  | "unsafe_replay_public_payload"
  | "state_hash_mismatch"
  | "missing_replay_action"
  | "missing_replay_application"
  | "event_type_mismatch";

type ReplayEventCheck = {
  eventId: GameEvent["eventId"];
  expected: StateHash;
} & (
  | {
      ok: true;
      actual: StateHash;
      randomCounterBefore: number;
      randomCounterAfter: number;
    }
  | { ok: false; reason: ReplayEventFailureReason; actual?: StateHash }
);

type ReplayOptions = { onEventChecked?: (check: ReplayEventCheck) => void };

const replayActionOptions = { publicEventsMode: "latest" } as const;

let defaultReplayHost: ReplayHost | undefined;

export function configureReplayHost(host: ReplayHost): void {
  defaultReplayHost = host;
}

export function replayEvents(
  initialState: GameState,
  eventLog: GameEvent[],
  options?: ReplayOptions,
): ReplayResult {
  if (!defaultReplayHost)
    throw new Error("Replay-Host ist nicht initialisiert.");
  return buildReplayEvents(defaultReplayHost, initialState, eventLog, options);
}

export function replayGameEvents(
  initialState: GameState,
  eventLog: GameEvent[],
  options?: ReplayOptions,
): ReplayResult {
  return replayEvents(initialState, eventLog, options);
}

export function buildReplayEvents(
  host: ReplayHost,
  initialState: GameState,
  eventLog: GameEvent[],
  options?: ReplayOptions,
): ReplayResult {
  let current = cloneReplayState({
    ...initialState,
    eventLog: initialState.eventLog.slice(0, 1),
  });
  const errors: string[] = [];
  const onEventChecked = options?.onEventChecked;
  function rejectEvent(
    event: GameEvent,
    reason: ReplayEventFailureReason,
    message: string,
    actual?: StateHash,
  ): void {
    errors.push(message);
    if (!onEventChecked || !isMatchEventId(event.eventId)) return;
    onEventChecked({
      eventId: event.eventId,
      expected: event.stateHashAfter,
      ok: false,
      reason,
      ...(actual === undefined ? {} : { actual }),
    });
  }
  for (const [index, event] of eventLog.entries()) {
    if (
      !isMatchEventId(event.eventId) ||
      event.eventId !== event.stateVersionAfter + 1
    ) {
      rejectEvent(
        event,
        "invalid_match_event_id",
        `Invalid match event ID at state version ${event.stateVersionAfter}.`,
      );
      break;
    }
    const createsGame = event.type === "game_created";
    if (createsGame) {
      if (
        index !== 0 ||
        current.stateVersion !== 0 ||
        event.stateVersionBefore !== 0 ||
        event.stateVersionAfter !== 0
      ) {
        rejectEvent(
          event,
          "unexpected_game_creation",
          `Unexpected game creation at event ${event.eventId}.`,
        );
        break;
      }
    } else if (
      event.stateVersionBefore !== current.stateVersion ||
      event.stateVersionAfter !== current.stateVersion + 1
    ) {
      rejectEvent(
        event,
        "invalid_state_version_transition",
        `Invalid state version transition at event ${event.eventId}.`,
      );
      break;
    }
    try {
      sanitizeEventPayloadForSurface(event.publicPayload, "replay_public");
    } catch (error) {
      rejectEvent(
        event,
        "unsafe_replay_public_payload",
        `Event ${event.eventId} has unsafe replay public payload: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      break;
    }
    if (createsGame) {
      const actual = hashState(current);
      if (event.stateHashAfter !== actual) {
        rejectEvent(
          event,
          "state_hash_mismatch",
          `StateHash mismatch at ${event.eventId}.`,
          actual,
        );
        break;
      }
      onEventChecked?.({
        eventId: event.eventId,
        expected: event.stateHashAfter,
        ok: true,
        actual,
        randomCounterBefore: current.randomCounter,
        randomCounterAfter: current.randomCounter,
      });
      continue;
    }
    const actionPayload =
      event.privatePayload?.[event.publicPayload.actor as Side]?.action;
    const declaresRandomizedIceCommand =
      typeof actionPayload === "object" &&
      actionPayload !== null &&
      "kind" in actionPayload &&
      actionPayload.kind === "engine_randomized_ice_install_selection";
    const declaresRandomizedTurnPlanCommand =
      typeof actionPayload === "object" &&
      actionPayload !== null &&
      "kind" in actionPayload &&
      actionPayload.kind === "engine_randomized_turn_plan_selection";
    const declaresRandomizedTraceBidCommand =
      typeof actionPayload === "object" &&
      actionPayload !== null &&
      "kind" in actionPayload &&
      actionPayload.kind === "engine_randomized_trace_bid_selection";
    const randomizedCommand = isReplayRandomizedIceInstallSelectionCommand(
      actionPayload,
    )
      ? actionPayload
      : undefined;
    const randomizedTurnPlanCommand =
      isReplayRandomizedTurnPlanSelectionCommand(actionPayload)
        ? actionPayload
        : undefined;
    const randomizedTraceBidCommand =
      isReplayRandomizedTraceBidSelectionCommand(actionPayload)
        ? actionPayload
        : undefined;
    const playerAction =
      !declaresRandomizedIceCommand &&
      !declaresRandomizedTurnPlanCommand &&
      !declaresRandomizedTraceBidCommand &&
      isReplayCompatibilityActionPayload(actionPayload)
        ? actionPayload
        : undefined;
    if (
      !randomizedCommand &&
      !randomizedTurnPlanCommand &&
      !randomizedTraceBidCommand &&
      !playerAction
    ) {
      rejectEvent(
        event,
        "missing_replay_action",
        `Event ${event.eventId} has no replayable action.`,
      );
      break;
    }
    if (
      randomizedTurnPlanCommand &&
      !host.actions.applyRandomizedTurnPlanSelection
    ) {
      rejectEvent(
        event,
        "missing_replay_application",
        `Event ${event.eventId} has no TurnPlan replay application.`,
      );
      break;
    }
    if (randomizedCommand && !host.actions.applyRandomizedIceInstallSelection) {
      rejectEvent(
        event,
        "missing_replay_application",
        `Event ${event.eventId} has no randomized replay application.`,
      );
      break;
    }
    if (
      randomizedTraceBidCommand &&
      !host.actions.applyRandomizedTraceBidSelection
    ) {
      rejectEvent(
        event,
        "missing_replay_application",
        `Event ${event.eventId} has no Trace-Bid replay application.`,
      );
      break;
    }
    const result = randomizedCommand
      ? host.actions.applyRandomizedIceInstallSelection!(
          current,
          randomizedCommand,
          replayActionOptions,
        )
      : randomizedTurnPlanCommand
        ? host.actions.applyRandomizedTurnPlanSelection!(
            current,
            randomizedTurnPlanCommand,
            replayActionOptions,
          )
        : randomizedTraceBidCommand
          ? host.actions.applyRandomizedTraceBidSelection!(
              current,
              randomizedTraceBidCommand,
              replayActionOptions,
            )
          : host.actions.applyAction(current, playerAction!, replayActionOptions);
    if (!result.ok) {
      rejectEvent(
        event,
        result.error.code,
        `Replay failed at ${event.eventId}: ${result.error.code}`,
      );
      break;
    }
    if (result.event.type !== event.type) {
      rejectEvent(
        event,
        "event_type_mismatch",
        `Event type mismatch at ${event.eventId}.`,
        result.stateHash,
      );
      break;
    }
    if (result.stateHash !== event.stateHashAfter) {
      rejectEvent(
        event,
        "state_hash_mismatch",
        `StateHash mismatch at ${event.eventId}.`,
        result.stateHash,
      );
      break;
    }
    onEventChecked?.({
      eventId: event.eventId,
      expected: event.stateHashAfter,
      ok: true,
      actual: result.stateHash,
      randomCounterBefore: current.randomCounter,
      randomCounterAfter: result.state.randomCounter,
    });
    current = result.state;
  }
  const lastHash = eventLog.at(-1)?.stateHashAfter;
  const actualFinalStateHash = hashState(current);
  if (
    errors.length === 0 &&
    lastHash !== undefined &&
    lastHash !== actualFinalStateHash
  ) {
    errors.push("Final StateHash mismatch.");
  }
  return {
    ok: errors.length === 0,
    state: current,
    ...(lastHash ? { expectedFinalStateHash: lastHash } : {}),
    actualFinalStateHash,
    errors,
  };
}

function cloneReplayState<T>(state: T): T {
  return structuredClone(state) as T;
}
