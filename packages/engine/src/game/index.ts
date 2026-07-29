// ARCH-2 game facade: wiring only, no gameplay or card logic lives here yet.
// Later ARCH steps can move rule families behind this stable import edge.
export { createGame, createGameAfterSetup } from "./create-game";
export { applyAction } from "./apply-action";
export {
  applyRandomizedIceInstallSelection,
  candidateFingerprint,
  quoteRandomizedIceInstallSelection,
} from "./randomized-ice-install-selection";
export {
  applyRandomizedTurnPlanSelection,
  quoteRandomizedTurnPlanSelection,
  turnPlanCandidateFingerprint,
} from "./randomized-turn-plan-selection";
export { applyGameAction } from "./apply-game-action";
export { legalActionsFor } from "./legal-actions";
export {
  buildPlayerViewProjection,
  getPlayerView,
  playerViewFor,
} from "./player-view";
export {
  corpPunishRouteRequestFingerprint,
  quoteCorpPunishRoute,
} from "./view/corp-punish-route-quotes";
export { hashGameState, hashState } from "./hash";
export { replayEvents, replayGameEvents } from "./replay";
export { validateGameState, validateGameStateForDebug } from "./validation";
export { checkWinConditions } from "./win-conditions";
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
  corpIcePostInstallRezProjectionPayload,
  corpServerIdForInstalledCard,
  costQuotePublicPayload,
  costQuoteToLegalActionCosts,
  discountedRezSourceIdsForRunIce,
  projectCorpIceRezCostAfterInstall,
  projectInstalledCorpIceRezCost,
  quoteCorpIceInstallCost,
  quoteCorpRezCost,
  rezCostForCard,
  rezCostReductionSourceDefinitionIdsFor,
} from "./payment";
