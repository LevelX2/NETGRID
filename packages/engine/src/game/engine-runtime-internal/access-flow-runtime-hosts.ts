import {
type GameState,type LegalAction
} from "@netgrid/shared";
import {
type AccessEffectHandlerHost
} from "../access/access-effect-handlers";
import {
type AccessFlowHost
} from "../access/access-flow";
import {
type BreachStateHost
} from "../access/breach-state";
import {
type RunAccessTransitionHost
} from "../run/run-access-transition";
import type { RuntimeDeps } from "./runtime-shared";

export function createAccessFlowRuntimeHosts(
  deps: RuntimeDeps,
): import("./access-flow-runtime-port").AccessFlowRuntimePort {
  function breachStateHost(state: GameState): BreachStateHost {
    return deps.accessFlow.breachStateHost(state);
  }

  function accessFlowHost(state: GameState): AccessFlowHost {
    return deps.accessFlow.accessFlowHost(state);
  }

  function runAccessTransitionHost(state: GameState): RunAccessTransitionHost {
    return deps.runFlow.runAccessTransitionHost(state);
  }

  function accessEffectHandlerHost(
    state: GameState,
    legalAction?: LegalAction,
  ): AccessEffectHandlerHost {
    return deps.accessFlow.accessEffectHandlerHost(state, legalAction);
  }

  return {
    breachStateHost,
    accessFlowHost,
    runAccessTransitionHost,
    accessEffectHandlerHost,
  };
}
