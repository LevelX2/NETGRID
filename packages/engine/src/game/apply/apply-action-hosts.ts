import type {
  ApplyActionOptions,
  EngineResult,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import {
  configureApplyGameActionHost,
  type ApplyGameActionHost,
} from "../apply-game-action";
import {
  configureApplyActionCoreHost,
  type ApplyActionCoreHost,
} from "../apply-action";
import {
  createPerformActionExecutorFromDependencies,
  type PerformActionExecutionDependencies,
} from "./perform-action";
import {
  configureReplayHost,
  type ReplayHost,
} from "../replay";

export type ApplyActionHostCompositionHost = {
  actions?: {
    applyAction: (
      state: GameState,
      playerAction: PlayerAction,
      options?: ApplyActionOptions,
    ) => EngineResult;
    afterPerformAction?: (state: GameState, legalAction: LegalAction) => void;
  };
  perform: PerformActionExecutionDependencies;
};

export type ApplyActionHostComposition = {
  performAction: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  applyActionCoreHost: ApplyActionCoreHost;
  applyGameActionHost?: ApplyGameActionHost;
  replayHost?: ReplayHost;
};

export function createApplyActionHostComposition(
  host: ApplyActionHostCompositionHost,
): ApplyActionHostComposition {
  const performAction = createPerformActionExecutorFromDependencies(host.perform);
  const applyGameActionHost = host.actions
    ? { actions: { applyAction: host.actions.applyAction } }
    : undefined;
  const replayHost = host.actions
    ? { actions: { applyAction: host.actions.applyAction } }
    : undefined;
  return {
    performAction,
    applyActionCoreHost: {
      actions: {
        performAction,
        ...(host.actions?.afterPerformAction
          ? { afterPerformAction: host.actions.afterPerformAction }
          : {}),
      },
    },
    ...(applyGameActionHost ? { applyGameActionHost } : {}),
    ...(replayHost ? { replayHost } : {}),
  };
}

export function configureApplyActionHostComposition(
  host: ApplyActionHostCompositionHost,
): ApplyActionHostComposition {
  const composition = createApplyActionHostComposition(host);
  configureApplyActionCoreHost(composition.applyActionCoreHost);
  if (composition.applyGameActionHost)
    configureApplyGameActionHost(composition.applyGameActionHost);
  if (composition.replayHost) configureReplayHost(composition.replayHost);
  return composition;
}
