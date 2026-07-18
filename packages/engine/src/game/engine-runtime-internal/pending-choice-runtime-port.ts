/** Declarative typed port implemented by pending-choice-runtime-hosts.ts. */
import type {
  ChoiceRequest,
  GameState,
  LegalAction,
  PendingChoiceResolutionHost,
  PlayerAction,
  Side,
} from "./runtime-shared";

export type PendingChoiceRuntimePort = {
  discardChoice: (
    state: GameState,
    side: Side,
    requiredDiscardCount: number,
    stateVersion?: number,
  ) => ChoiceRequest;
  pendingChoiceResolutionHost: (
    state: GameState,
  ) => PendingChoiceResolutionHost;
  resolveDiscardChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveSetupMulliganChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  setupMulliganChoice: (
    state: GameState,
    side: Side,
    stateVersion?: number,
  ) => ChoiceRequest;
  takeSetupMulligan: (state: GameState, side: Side, handSize: number) => void;
};
