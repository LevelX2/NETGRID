import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  ChoiceOption,
  ChoiceRequest,
  CorpOptionalRezChoiceQuote,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";

export type SequencePayload = Record<string, string | number | boolean>;
export type CorpSequenceRezPaymentReceipt = {
  temporaryCreditsSpent: number;
  temporaryCreditsRemaining: number;
  corpCreditsSpent: number;
};

/**
 * @contract Shared host surface for corp scored-agenda sequence resolvers.
 * The Rules Engine remains the only legality authority; sequence modules only
 * resolve already-issued LegalActions and revalidate current state before
 * mutation.
 * @visibility Actor-private choices may use private labels, but public payloads
 * and returned results must stay count-/public-fact-only.
 */
export type CorpInstallRezSequenceHandlerHost = {
  state: Pick<
    GameState,
    | "corp"
    | "cardInstances"
    | "pendingChoice"
    | "hqInstallRezSequence"
    | "stateVersion"
  >;
  legalAction: LegalAction;
  playerAction?: PlayerAction;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    scoredAgendaKind: (cardId: CardInstanceId) => string | undefined;
    scoredAgendaForCard: (
      cardId: CardInstanceId,
    ) => CardScoredAgendaImplementation | undefined;
    isCorpInstallableCardType: (definition: CardDefinition) => boolean;
    canInstallCorpRootCardInServer: (
      definition: CardDefinition,
      server: CorpServer,
    ) => boolean;
    isRegionUpgrade: (definition: CardDefinition) => boolean;
    rootInstallRezzesOnInstall: (definition: CardDefinition) => boolean;
    isScoredAgendaFreeRezCandidate: (cardId: CardInstanceId) => boolean;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    moveCardToArchivesFaceup: (cardId: CardInstanceId) => void;
  };
  servers: {
    createRemote: () => CorpServer;
    mustServer: (serverId: string) => CorpServer;
    trashOlderRegionUpgradesInServer: (
      server: CorpServer,
      keepCardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
  };
  credits: {
    spendCorpCredits: (amount: number) => void;
  };
  callbacks: {
    payHqInstallCost: (
      cardId: CardInstanceId,
      server: CorpServer,
      temporaryCreditsAvailable: number,
    ) => CorpSequenceRezPaymentReceipt;
    recordSuccessfulCorpInstall: () => void;
    resolveCorpRootRez: (cardId: CardInstanceId) => void;
    preflightMandatoryHqInstallRez: (
      selectedCardIds: readonly CardInstanceId[],
      temporaryCreditsAvailable: number,
    ) => void;
    projectHqInstallRezOptionQuote: (
      choice: ChoiceRequest,
      option: ChoiceOption,
    ) => CorpOptionalRezChoiceQuote | undefined;
    payAndFinalizeHqInstallRezOption: (
      cardId: CardInstanceId,
      quote: Extract<CorpOptionalRezChoiceQuote, { complete: true }>,
    ) => CorpSequenceRezPaymentReceipt;
    payAndFinalizeMandatoryHqInstallRez: (
      cardId: CardInstanceId,
      temporaryCreditsAvailable: number,
    ) => CorpSequenceRezPaymentReceipt;
  };
};

export type CorpInstallRezSequenceHandlerResult = {
  handled: boolean;
  stateChanged?: boolean;
  deletePendingChoice?: boolean;
  createdServerId?: string;
  selectedCardIds?: CardInstanceId[];
  installedCardIds?: CardInstanceId[];
  rezzedCardIds?: CardInstanceId[];
  trashedCardIds?: CardInstanceId[];
  temporaryCreditsGranted?: number;
  temporaryCreditsReturned?: number;
  shownCardDefinitionIds?: string[];
  shownCount?: number;
  resolvedPayload?: SequencePayload;
};
