import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";

export type ScoredAgendaPayload = Record<string, string | number | boolean>;

export type ScoredAgendaFlowHost = {
  state: Pick<
    GameState,
    | "corp"
    | "cardInstances"
    | "pendingChoice"
    | "stateVersion"
    | "phase"
    | "activeSide"
    | "timingPoint"
    | "winner"
  >;
  legalAction?: LegalAction;
  playerAction?: PlayerAction;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    scoredAgendaForDefinition: (
      definition: CardDefinition,
    ) => CardScoredAgendaImplementation | undefined;
    effectiveAgendaDifficulty: (cardId: CardInstanceId) => number;
    hasSubtype: (definition: CardDefinition, subtype: string) => boolean;
    isOveradvanceAgendaDefinition: (definitionId: string) => boolean;
  };
  constants: {
    employeeEmpowermentId: string;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    cleanupEmptyRemotes: () => void;
    corpInstalledCardIds: () => CardInstanceId[];
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => unknown;
  };
  counters: {
    setCardCounter: (
      cardId: CardInstanceId,
      counterType: "agenda" | "mark",
      amount: number,
    ) => void;
    addCardCounter: (
      cardId: CardInstanceId,
      counterType: "boon" | "mark",
      amount: number,
    ) => void;
    cardCounter: (
      cardId: CardInstanceId,
      counterType: "boon" | "mark",
    ) => number;
  };
  credits: {
    gainCredits: (side: "corp", amount: number) => void;
    setCorpCredits: (amount: number) => void;
  };
  flags: {
    markScoredBlackOpsAgendaThisTurn: () => void;
    employeeEmpowermentResolvedSourceIds: () => CardInstanceId[];
    markEmployeeEmpowermentResolved: (cardId: CardInstanceId) => void;
  };
  effects: {
    executeOnScore: (
      definition: CardDefinition,
      cardId: CardInstanceId,
    ) => void;
    appendEmployeeEmpowermentDrawEffect: (
      cardId: CardInstanceId,
      drawnCount: number,
    ) => void;
  };
  draw: {
    drawCorpCard: () => void;
  };
  choices: {
    startHqToNewRemoteInstallRez: (cardId: CardInstanceId) => void;
    startScoredAgendaFreeRez: (cardId: CardInstanceId) => void;
    startCorporateDownsizing: (
      cardId: CardInstanceId,
      creditPerAgendaPoint: number,
    ) => void;
    resolveAgendaPurge: (cardId: CardInstanceId) => void;
  };
};

export type ScoredAgendaFlowResult = {
  handled: boolean;
  stateChanged?: boolean;
  agendaInstanceId?: CardInstanceId;
  agendaDefinitionId?: string;
  agendaPointsScored?: number;
  bonusAgendaPoints?: number;
  overadvancedBy?: number;
  gainedCredits?: number;
  lostCredits?: boolean;
  placedCounters?: number;
  pendingChoice?: ChoiceRequest;
  resolvedPayload?: ScoredAgendaPayload;
};
