import type {
  EngineResult,
  EngineRandomizedIceInstallSelectionCommand,
  EngineRandomizedIceInstallSelectionResult,
  EngineRandomizedTurnPlanSelectionCommand,
  EngineRandomizedTurnPlanSelectionResult,
  GameEvent,
  GameState,
  PlayerAction,
  ReplayResult,
  Side,
} from "@netgrid/shared";
import {
  isReplayCompatibilityActionPayload,
  isReplayRandomizedIceInstallSelectionCommand,
  isReplayRandomizedTurnPlanSelectionCommand,
} from "../compatibility/payload-compatibility";
import { hashState } from "./hash";
import { sanitizeEventPayloadForSurface } from "./view/surface-policy";

export type ReplayHost = {
  actions: {
    applyAction: (state: GameState, action: PlayerAction) => EngineResult;
    applyRandomizedIceInstallSelection?: (
      state: GameState,
      command: EngineRandomizedIceInstallSelectionCommand,
    ) => EngineRandomizedIceInstallSelectionResult;
    applyRandomizedTurnPlanSelection?: (
      state: GameState,
      command: EngineRandomizedTurnPlanSelectionCommand,
    ) => EngineRandomizedTurnPlanSelectionResult;
  };
};

let defaultReplayHost: ReplayHost | undefined;

export function configureReplayHost(host: ReplayHost): void {
  defaultReplayHost = host;
}

export function replayEvents(
  initialState: GameState,
  eventLog: GameEvent[],
): ReplayResult {
  if (!defaultReplayHost)
    throw new Error("Replay-Host ist nicht initialisiert.");
  return buildReplayEvents(defaultReplayHost, initialState, eventLog);
}

export function replayGameEvents(
  initialState: GameState,
  eventLog: GameEvent[],
): ReplayResult {
  return replayEvents(initialState, eventLog);
}

export function buildReplayEvents(
  host: ReplayHost,
  initialState: GameState,
  eventLog: GameEvent[],
): ReplayResult {
  let current = cloneReplayState({
    ...initialState,
    eventLog: initialState.eventLog.slice(0, 1),
  });
  const errors: string[] = [];
  for (const event of eventLog) {
    if (event.type === "game_created") continue;
    try {
      sanitizeEventPayloadForSurface(event.publicPayload, "replay_public");
    } catch (error) {
      errors.push(
        `Event ${event.eventId} has unsafe replay public payload: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
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
    const randomizedCommand = isReplayRandomizedIceInstallSelectionCommand(
      actionPayload,
    )
      ? actionPayload
      : undefined;
    const randomizedTurnPlanCommand =
      isReplayRandomizedTurnPlanSelectionCommand(actionPayload)
        ? actionPayload
        : undefined;
    const playerAction =
      !declaresRandomizedIceCommand &&
      !declaresRandomizedTurnPlanCommand &&
      isReplayCompatibilityActionPayload(actionPayload)
        ? actionPayload
        : undefined;
    if (!randomizedCommand && !randomizedTurnPlanCommand && !playerAction) {
      errors.push(`Event ${event.eventId} has no replayable action.`);
      continue;
    }
    if (
      randomizedTurnPlanCommand &&
      !host.actions.applyRandomizedTurnPlanSelection
    ) {
      errors.push(`Event ${event.eventId} has no TurnPlan replay application.`);
      continue;
    }
    if (randomizedCommand && !host.actions.applyRandomizedIceInstallSelection) {
      errors.push(
        `Event ${event.eventId} has no randomized replay application.`,
      );
      continue;
    }
    const result = randomizedCommand
      ? host.actions.applyRandomizedIceInstallSelection!(
          current,
          randomizedCommand,
        )
      : randomizedTurnPlanCommand
        ? host.actions.applyRandomizedTurnPlanSelection!(
            current,
            randomizedTurnPlanCommand,
          )
        : host.actions.applyAction(current, playerAction!);
    if (!result.ok) {
      errors.push(`Replay failed at ${event.eventId}: ${result.error.code}`);
      break;
    }
    current = result.state;
    if (result.stateHash !== event.stateHashAfter) {
      errors.push(`StateHash mismatch at ${event.eventId}.`);
      break;
    }
  }
  const lastHash = eventLog.at(-1)?.stateHashAfter;
  return {
    ok: errors.length === 0,
    state: current,
    ...(lastHash ? { expectedFinalStateHash: lastHash } : {}),
    actualFinalStateHash: hashState(current),
    errors,
  };
}

function cloneReplayState<T>(state: T): T {
  return structuredClone(state) as T;
}
