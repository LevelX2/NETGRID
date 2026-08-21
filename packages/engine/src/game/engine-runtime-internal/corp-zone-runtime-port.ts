/** Declarative typed port implemented by corp-zone-runtime-hosts.ts. */
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  CorpServer,
  CorpZoneChoiceHandlerHost,
  CounterType,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "./runtime-shared";

export type CorpZoneRuntimePort = {
  addCounterToAllInstalledRunnerIcebreakers: (
    state: GameState,
    counterType: CounterType,
    amount: number,
  ) => {
    amount: number;
    counterType: Extract<
      CounterType,
      "militech" | "pattel" | "breaker_strength_penalty"
    >;
    countersAfter: number;
    publicPayload: Record<string, string | number | boolean>;
  };
  chooseCorpAgendasForPointCost: (
    state: GameState,
    requiredPoints: number,
  ) => CardInstanceId[];
  corpAgendaPointTotal: (state: GameState) => number;
  corpZoneChoiceHandlerHost: (
    state: GameState,
    legalAction: LegalAction,
    playerAction?: PlayerAction,
  ) => CorpZoneChoiceHandlerHost;
  exposeCorpCardInServer: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    legalAction: LegalAction,
  ) => void;
  exposeInstalledCorpCardForImplementation: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    targetCardId: CardInstanceId,
    scope: "inside_data_fort" | "any_installed",
  ) => {
    publicPayload: Record<string, string | number | boolean>;
  };
  exposeInstalledCorpCardLabel: (
    state: GameState,
    cardId: CardInstanceId,
  ) => string;
  exposeInstalledCorpCardTargets: (
    state: GameState,
    _scope: "inside_data_fort" | "any_installed",
  ) => CardInstanceId[];
  exposeInstalledCorpCardsChoiceOptions: (
    state: GameState,
    scope?: "inside_data_fort" | "any_installed",
  ) => {
    id: string;
    label: string;
    value: string;
  }[];
  exposeOutermostIceOfEachDataFort: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId?: CardInstanceId,
    sourceDefinitionId?: CardDefinition["id"],
  ) => {
    publicPayload: Record<string, string | number | boolean>;
  };
  exposedCorpCardInServer: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ) => CardInstanceId | undefined;
  multiExposeInstalledCorpCardOptionLabel: (
    state: GameState,
    cardId: CardInstanceId,
  ) => string;
  multiExposeInstalledCorpCardTargets: (state: GameState) => CardInstanceId[];
  installedCorpCardServerContext: (
    state: GameState,
    cardId: CardInstanceId,
  ) =>
    | {
        server: CorpServer;
        area: "root" | "ice";
        index: number;
      }
    | undefined;
  installedRunnerIcebreakerIds: (state: GameState) => CardInstanceId[];
  outermostIceExposures: (state: GameState) => Array<{
    server: CorpServer;
    cardId: CardInstanceId;
  }>;
  resolveRunnerIcebreakerCounterEvent: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  resolveExposePreventionChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveExposeInstalledCorpCardsChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveMultiExposeInstalledCorpCardsChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resolveScoredAgendaCorpRdTopReveal: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  shuffleCorpCardIntoRd: (
    state: GameState,
    cardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    reason: "lifecycle" | "access" | "operation",
  ) => {
    publicPayload: Record<string, string | number | boolean>;
  };
  startExposeInstalledCorpCardsChoice: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    min: number,
    max: number,
    scope?: "any_installed" | "inside_data_fort" | "single_data_fort",
  ) => {
    publicPayload: Record<string, string | number | boolean>;
  };
  startMultiExposeInstalledCorpCardsChoice: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  trashCorpInstalledCardsInScoredSourceServer: (
    state: GameState,
    legalAction: LegalAction | undefined,
    _sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
  ) => {
    publicPayload: Record<string, string | number | boolean>;
  };
};
