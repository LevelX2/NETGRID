/** Declarative typed port implemented by access-flow-runtime-hosts.ts. */
import type { GameState, LegalAction } from "@netgrid/shared";
import type { AccessEffectHandlerHost } from "../access/access-effect-handlers";
import type { AccessFlowHost } from "../access/access-flow";
import type { BreachStateHost } from "../access/breach-state";
import type { RunAccessTransitionHost } from "../run/run-access-transition";

export type AccessFlowRuntimePort = {
  breachStateHost: (state: GameState) => BreachStateHost;
  accessFlowHost: (state: GameState) => AccessFlowHost;
  runAccessTransitionHost: (state: GameState) => RunAccessTransitionHost;
  accessEffectHandlerHost: (
    state: GameState,
    legalAction?: LegalAction,
  ) => AccessEffectHandlerHost;
};
