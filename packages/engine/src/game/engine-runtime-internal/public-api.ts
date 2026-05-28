import "./runtime-bootstrap";

export { getLegalActions, legalActionsFor } from "../legal-actions";
export {
  eventVisibilityForAction,
  isHiddenInfoBarrierEvent,
} from "../events/build-event";
export { checkWinConditions } from "../win-conditions";
export { quoteCorpRezCost } from "../payment";
export { createGame, createGameAfterSetup } from "../create-game";
export { applyAction } from "../apply-action";
export { applyGameAction } from "../apply-game-action";
export { getPlayerView, playerViewFor } from "../player-view";
export { replayEvents, replayGameEvents } from "../replay";
export { redactPublicEventForSide } from "../view/public-event-view";
export { hashGameState, hashState } from "../hash";
export { validateGameState, validateGameStateForDebug } from "../validation";
export {
  validateDeckDefinition,
  applyEffectCommands,
} from "./runtime-bootstrap";
export {
  DEMO_CARDS,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  CURRENT_RULES_BASELINE,
} from "@netgrid/shared";
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
  CreateGameConfig,
  DeckDefinition,
  DeckPublicMetadata,
  DemoDeckId,
  DamageType,
  ApplyActionOptions,
  EngineError,
  EngineResult,
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
} from "@netgrid/shared";
