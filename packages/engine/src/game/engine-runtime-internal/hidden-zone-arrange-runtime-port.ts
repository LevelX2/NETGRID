/** Declarative typed port implemented by hidden-zone-arrange-runtime.ts. */
import type {
  GameState,
  HiddenZoneArrangeChoiceHandlerHost,
  LegalAction,
  PlayerAction,
} from "./runtime-shared";

export type HiddenZoneArrangeRuntimePort = {
  hiddenZoneArrangeChoiceHandlerHost: (
    state: GameState,
    legalAction: LegalAction,
    playerAction?: PlayerAction,
  ) => HiddenZoneArrangeChoiceHandlerHost;
  resolveP358HiddenReplacementChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
};
