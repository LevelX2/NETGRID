import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../ability-engine/definition-types";
import {
  isHqToNewRemoteInstallRezChoiceSource,
  isHqToNewRemoteInstallRezRezChoiceSource,
  resolveHqToNewRemoteInstallRezChoice,
  resolveHqToNewRemoteInstallRezRezChoice,
} from "./scored-agenda/data-fort-reclamation-sequence";
import {
  isSecurityPurgeInstallTargetChoiceSource,
  resolveSecurityPurgeInstallTargetChoice,
} from "./scored-agenda/security-purge-sequence";
import {
  isPriorityRequisitionChoiceSource,
  resolvePriorityRequisitionChoice,
} from "./scored-agenda/priority-requisition-sequence";
export { startDataFortReclamationChoice } from "./scored-agenda/data-fort-reclamation-sequence";
export { startPriorityRequisitionChoice } from "./scored-agenda/priority-requisition-sequence";
export { resolveSecurityPurgeAgendaPurge } from "./scored-agenda/security-purge-sequence";

type SequencePayload = Record<string, string | number | boolean>;

/**
 * @contract Hosts CardImplementation install/rez sequence choices while the
 * Rules Engine remains the only legality authority.
 * @authority Handler callbacks must mutate state only after side, source,
 * hidden-zone order, cost and target checks have passed.
 * @visibility Hidden-zone choices may expose actor labels but public/opponent
 * surfaces receive counts or public card facts only.
 */
export type CorpInstallRezSequenceHandlerHost = {
  state: Pick<
    GameState,
    "corp" | "cardInstances" | "pendingChoice" | "stateVersion"
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
    rezCostForCard: (cardId: CardInstanceId) => number;
    isPriorityRequisitionCandidate: (cardId: CardInstanceId) => boolean;
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
    resolveCorpRootRez: (cardId: CardInstanceId) => void;
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

export function handleCorpInstallRezSequenceChoice(
  host: CorpInstallRezSequenceHandlerHost,
): CorpInstallRezSequenceHandlerResult {
  const source = host.state.pendingChoice?.source ?? "";
  if (isPriorityRequisitionChoiceSource(source))
    return resolvePriorityRequisitionChoice(host);
  if (isHqToNewRemoteInstallRezRezChoiceSource(source))
    return resolveHqToNewRemoteInstallRezRezChoice(host);
  if (isHqToNewRemoteInstallRezChoiceSource(source))
    return resolveHqToNewRemoteInstallRezChoice(host);
  if (isSecurityPurgeInstallTargetChoiceSource(source))
    return resolveSecurityPurgeInstallTargetChoice(host);
  return { handled: false };
}
