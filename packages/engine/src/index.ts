/**
 * Public entrypoint for @netgrid/engine.
 *
 * This facade intentionally contains no gameplay or runtime implementation.
 * Runtime internals live below game/ and engine-runtime-internal.
 */

export {
  getLegalActions,
  legalActionsFor,
  eventVisibilityForAction,
  isHiddenInfoBarrierEvent,
  checkWinConditions,
  quoteCorpRezCost,
  createGame,
  createGameAfterSetup,
  applyAction,
  applyRandomizedIceInstallSelection,
  candidateFingerprint,
  quoteRandomizedIceInstallSelection,
  applyRandomizedTurnPlanSelection,
  quoteRandomizedTurnPlanSelection,
  turnPlanCandidateFingerprint,
  applyGameAction,
  getPlayerView,
  playerViewFor,
  corpPunishRouteRequestFingerprint,
  quoteCorpPunishRoute,
  replayEvents,
  replayGameEvents,
  redactPublicEventForSide,
  hashGameState,
  hashState,
  validateGameState,
  validateGameStateForDebug,
  validateDeckDefinition,
  applyEffectCommands,
  CARD_DEFINITIONS,
  CARD_DEFINITIONS_BY_ID,
  DEMO_DECKS,
  CURRENT_RULES_BASELINE,
} from "./game/engine-runtime";

export {
  traceBaseLinkCardImplementationQuotesForDefinition,
  type TraceBaseLinkCardImplementationQuote,
} from "./game/trace/base-link";

export {
  traceSuccessEffectCardImplementationQuotesForDefinition,
  type TraceSuccessEffectCardImplementationQuote,
} from "./game/trace/success-effect-quote";

export { cardImplementationForDefinitionId } from "./card-implementations/registry";

export {
  visibleBreakerEncounterQuote,
  type VisibleBreakerEncounterQuote,
} from "./game/view/visible-breaker-encounter-quote";

export type {
  ActionType,
  ChoiceRequest,
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CardType,
  CounterType,
  CorpServer,
  CorpPunishRouteQuoteRequest,
  CorpPunishRouteQuoteResult,
  CreateGameConfig,
  DeckDefinition,
  DeckPublicMetadata,
  DemoDeckId,
  DamageType,
  ApplyActionOptions,
  EngineError,
  EngineResult,
  EngineRandomizedIceInstallCandidate,
  EngineRandomizedIceInstallSelectionCommand,
  EngineRandomizedIceInstallSelectionQuote,
  EngineRandomizedIceInstallSelectionQuoteResult,
  EngineRandomizedIceInstallSelectionReceipt,
  EngineRandomizedIceInstallSelectionRequest,
  EngineRandomizedIceInstallSelectionResult,
  EventVisibilityClass,
  EventModificationCandidate,
  EventModificationWindow,
  EffectCommand,
  GameEvent,
  GameEndReason,
  GameState,
  ImminentEvent,
  LegalAction,
  PlayerAction,
  ReplayableEngineAction,
  PlayerController,
  PlayerView,
  PublicGameEvent,
  ReplacementCandidate,
  ReplacementWindow,
  ReplayResult,
  RulesBaseline,
  ServerId,
  SetupState,
  Side,
  StateHash,
  SpecialZoneKind,
  SpecialZoneState,
  SpecialZoneVisibility,
  ValidationResult,
  VisibleCard,
  Winner,
} from "./game/engine-runtime";
