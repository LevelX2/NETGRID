import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type { FortPassWindowHost } from "../fort-pass-window";

export type ActiveRun = NonNullable<GameState["run"]>;

export type RunWindowHost = {
  state: GameState;
  servers: {
    mustServer: (
      serverId: Exclude<ServerId, "new_remote"> | string,
    ) => CorpServer;
  };
};

export type RunWindowTimingContext = {
  run: ActiveRun;
  server: CorpServer;
};

export type RunRezWindowHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    runnerInstalledProgramIds: () => CardInstanceId[];
  };
  servers: {
    mustServer: (
      serverId: Exclude<ServerId, "new_remote"> | string,
    ) => CorpServer;
    publicServerLabel: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => string | undefined;
  };
  fortPass: FortPassWindowHost;
  choices: {
    selectedChoiceIds: (
      selectedChoices: PlayerAction["selectedChoices"],
    ) => string[];
  };
  callbacks: {
    canReplaceFortCardsFromHq: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => boolean;
    continueAfterRootRez: (legalAction?: LegalAction) => void;
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
    trashCorpInstalledCardToArchives: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    activeObligationCount: () => number;
    addActiveObligation: (amount: number) => void;
  };
};

export type RunRezWindowResult = {
  handled: boolean;
  rezzedCardId?: CardInstanceId;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: string;
  serverId?: Exclude<ServerId, "new_remote"> | string;
  rootEffectResolved?: boolean;
  speedTrapChoiceStarted?: boolean;
  speedTrapResolved?: boolean;
  runnerJackedOut?: boolean;
  continueAfterRez?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]> | undefined;
  stateChanged?: boolean;
};

export type RootRezEffectResult = RunRezWindowResult;
export type RootRezContinuationResult = RunRezWindowResult;
export type SpeedTrapRezWindowResult = RunRezWindowResult & {
  successfulRunWithoutAccess?: boolean;
};
export type RunRezActionBuildResult = {
  legalActions: LegalAction[];
};
