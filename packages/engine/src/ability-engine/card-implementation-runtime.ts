/**
 * Public CardImplementation runtime API.
 *
 * The executable runtime is split by responsibility so card contracts, lifecycle
 * hooks, activated abilities, and on-play execution stay below module-size
 * guards while preserving this stable import surface.
 */
export type {
  CardImplementationRuntimeDependencies,
  RuntimeEffectCollector,
} from "./card-implementation-runtime-dependency-types";
export type { ImmediateLifecycle } from "./card-implementation-runtime-lifecycle-immediate";
export { canPlayPrintedCostOnPlayImplementation } from "./card-implementation-runtime-legality";
export { executeCardImplementationLifecycleEffects } from "./card-implementation-runtime-lifecycle-immediate";
export {
  executeCardImplementationRunnerRunStartEffects,
  executeCardImplementationStartOfCorpTurnEffects,
  executeCardImplementationStartOfRunnerTurnEffects,
} from "./card-implementation-runtime-lifecycle-start";
export {
  pushCardImplementationEndOfRunnerTurnActions,
  resolveCardImplementationEndOfRunnerTurnAction,
} from "./card-implementation-runtime-lifecycle-end-turn";
export {
  pushActivatedCardImplementationActions,
  pushActivatedCardImplementationActionsForTiming,
} from "./card-implementation-runtime-activated-actions";
export { resolveActivatedCardImplementationAbility } from "./card-implementation-runtime-activated-resolve";
export { executeOnPlayCardImplementationAbility } from "./card-implementation-runtime-onplay";
