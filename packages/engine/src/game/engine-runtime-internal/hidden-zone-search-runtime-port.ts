/** Declarative typed port implemented by hidden-zone-search-runtime.ts. */
import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  HiddenZoneSearchActivationHandlerHost,
  HiddenZoneSearchChoiceHandlerHost,
  LegalAction,
  PlayerAction,
} from "./runtime-shared";

export type HiddenZoneSearchRuntimePort = {
  canInstallRunnerProgramFromZone: (
    state: GameState,
    cardId: CardInstanceId,
    zone: "heap" | "stack",
    installCost: "normal" | "free",
  ) => boolean;
  hiddenZoneSearchActivationHandlerHost: (
    state: GameState,
    legalAction: LegalAction,
  ) => HiddenZoneSearchActivationHandlerHost;
  hiddenZoneSearchActivationTargetHost: (state: GameState) => {
    state: GameState;
    constants: {
      topStackTakeMatchingSourceId: string;
      randomStackProgramInstallSourceId: string;
      stackProgramFreeInstallSourceId: string;
      stackSearchGripSourceId: string;
      temporaryProgramInstallSourceId: string;
    };
    cards: {
      definitionFor: (cardId: CardInstanceId) => CardDefinition;
      isUniqueRunnerDefinitionInstalled: (
        definition: CardDefinition,
      ) => boolean;
    };
    install: {
      canInstallRunnerProgramFromZone: (
        cardId: CardInstanceId,
        sourceZone: "heap" | "stack",
        installCost: "normal" | "free",
      ) => boolean;
    };
    runnerMemoryLimit: () => number;
    shuffleRunnerStack: (purpose: string) => void;
  };
  hiddenZoneSearchChoiceHandlerHost: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => HiddenZoneSearchChoiceHandlerHost;
  hiddenZoneSearchHandlerHostBase: (
    state: GameState,
    legalAction: LegalAction,
  ) => HiddenZoneSearchActivationHandlerHost;
  installRunnerProgramForFree: (
    state: GameState,
    cardId: CardInstanceId,
    legalAction: LegalAction,
    options?: {
      checkUnique?: boolean;
      typeError?: string;
      memoryError?: string;
    },
  ) => CardInstanceId;
  installRunnerProgramFromStackWithoutClick: (
    state: GameState,
    cardId: CardInstanceId,
    legalAction: LegalAction,
  ) => boolean;
  installRunnerProgramFromZoneWithoutClick: (
    state: GameState,
    cardId: CardInstanceId,
    zone: "heap" | "stack",
    installCost: "normal" | "free",
    legalAction: LegalAction,
  ) => boolean;
  resolveV1911RunnerHiddenZoneAbility: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  revealCorpRdTop: (state: GameState, legalAction: LegalAction) => void;
  revealRunnerStackTop: (state: GameState, legalAction: LegalAction) => void;
  shuffleRunnerStack: (state: GameState, purpose: string) => void;
  startRunnerProgramFreeMemoryChoice: (
    state: GameState,
    selectedProgramId: CardInstanceId,
  ) => boolean;
};
