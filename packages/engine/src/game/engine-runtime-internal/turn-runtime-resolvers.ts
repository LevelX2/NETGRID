import type { RuntimeDeps } from "./runtime-shared";
import {
  acceptExtraActionOffer,
  addFutureExtraActionGrant,
  addRunnerFutureActionDebt,
  applyRunnerForgoNextAction,
  compactActionEconomy,
  consumeRestrictedExtraActionForAction,
  consumeRunnerFutureActionDebt,
  currentTurnSerial,
  declineExtraActionOffer,
  ensureActionEconomy,
  expireTurnBoundExtraActionGrants,
  filterActionsForRestrictedExtraActions,
  resolveForcedActionNotPossible,
} from "./turn-action-economy-runtime";
import { createTurnCorpStartRuntimeResolvers } from "./turn-corp-start-runtime-resolvers";
import { createTurnEffectRuntimeResolvers } from "./turn-effect-runtime-resolvers";
import { createTurnEndRuntimeResolvers } from "./turn-end-runtime-resolvers";
import { createTurnRunnerStartRuntimeResolvers } from "./turn-runner-start-runtime-resolvers";
import { createTurnStartTagContinuationResolver } from "./turn-start-tag-continuation";

type TurnRuntimePort = import("./turn-runtime-port").TurnRuntimePort;

/**
 * Composes the turn state machines over one stable link object. Subfactories
 * may refer to each other through this object, but no resolver runs before the
 * complete turn runtime has been installed.
 */
export function createTurnRuntimeResolvers(deps: RuntimeDeps): TurnRuntimePort {
  const runtime = {} as TurnRuntimePort;
  Object.assign(
    runtime,
    createTurnEffectRuntimeResolvers(deps, runtime),
    createTurnCorpStartRuntimeResolvers(deps, runtime),
    createTurnRunnerStartRuntimeResolvers(deps, runtime),
    createTurnEndRuntimeResolvers(deps, runtime),
    {
      acceptExtraActionOffer,
      addFutureExtraActionGrant,
      addRunnerFutureActionDebt,
      applyRunnerForgoNextAction,
      compactActionEconomy,
      consumeRestrictedExtraActionForAction,
      consumeRunnerFutureActionDebt,
      currentTurnSerial,
      declineExtraActionOffer,
      ensureActionEconomy,
      expireTurnBoundExtraActionGrants,
      filterActionsForRestrictedExtraActions,
      resolveForcedActionNotPossible,
    },
  );
  runtime.resumeStartOfTurnAfterTagPrevention =
    createTurnStartTagContinuationResolver(deps, {
      applyCorpStartOfTurnEffects: runtime.applyCorpStartOfTurnEffects,
      openCorpStartTurnRestrictedActionOffers:
        runtime.openCorpStartTurnRestrictedActionOffers,
      applyRunnerStartOfTurnEffects: runtime.applyRunnerStartOfTurnEffects,
      appendResolvedEffectsToPayload: runtime.appendResolvedEffectsToPayload,
    });
  return runtime;
}
