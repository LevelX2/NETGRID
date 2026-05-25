import type {
  ApplyActionOptions,
  EngineResult,
  GameState,
  PlayerAction,
} from "@netgrid/shared";

export type ApplyGameActionHost = {
  actions: {
    applyAction: (
      state: GameState,
      playerAction: PlayerAction,
      options?: ApplyActionOptions,
    ) => EngineResult;
  };
};

let defaultApplyGameActionHost: ApplyGameActionHost | undefined;

export function configureApplyGameActionHost(
  host: ApplyGameActionHost | undefined,
): void {
  defaultApplyGameActionHost = host;
}

export function applyGameAction(
  state: GameState,
  playerAction: PlayerAction,
  options: ApplyActionOptions = {},
): EngineResult {
  if (!defaultApplyGameActionHost)
    throw new Error("ApplyGameAction-Host ist nicht initialisiert.");
  return buildApplyGameAction(
    defaultApplyGameActionHost,
    state,
    playerAction,
    options,
  );
}

export function buildApplyGameAction(
  host: ApplyGameActionHost,
  state: GameState,
  playerAction: PlayerAction,
  options: ApplyActionOptions = {},
): EngineResult {
  return host.actions.applyAction(state, playerAction, options);
}
