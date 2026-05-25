// ARCH-2 game facade: wiring only, no gameplay or card logic lives here yet.
// Later ARCH steps can move rule families behind this stable import edge.
export { createGame, createGameAfterSetup } from "./create-game";
export { applyGameAction } from "./apply-game-action";
export { legalActionsFor } from "./legal-actions";
export {
  buildPlayerViewProjection,
  getPlayerView,
  playerViewFor,
} from "./player-view";
export { hashGameState, hashState } from "./hash";
export { replayGameEvents } from "./replay";
export { validateGameState, validateGameStateForDebug } from "./validation";
export {
  buildCorpDrawAction,
  buildCorpEndTurnAction,
  buildCorpGainCreditAction,
  buildCorpNewRemoteIceInstallAction,
  buildCorpNewRemoteRootInstallAction,
  buildCorpPurgeVirusAction,
  buildCorpServerIceInstallAction,
  buildCorpServerRootInstallAction,
  buildRunnerEndTurnAction,
  buildRunnerDrawCardActions,
  buildRunnerGainCreditAction,
  buildRunnerHardwareInstallAction,
  buildRunnerProgramInstallAction,
  buildRunnerRemoveTagAction,
  buildRunnerResourceInstallAction,
  buildLegalAction,
  makeActionId,
  stableLegalActionPayload,
  type CorpIceInstallCostDetails,
  type CorpInstallServerRef,
  type CorpRootInstallOptions,
  type LegalActionMetadata,
  type RunnerDrawActionContext,
} from "./turn";
export type {
  CorpInstallCostOptions,
  CorpRezCostOptions,
  CostModifierQuote,
  CostPurpose,
  CostQuote,
} from "./payment";
export {
  assertCorpRezCostQuoteValid,
  corpServerIdForInstalledCard,
  costQuotePublicPayload,
  costQuoteToLegalActionCosts,
  oliviaSalazarRezSourcesForRunIce,
  quoteCorpIceInstallCost,
  quoteCorpRezCost,
  rezCostForCard,
  rezCostReductionSourceDefinitionIdsFor,
} from "./payment";
