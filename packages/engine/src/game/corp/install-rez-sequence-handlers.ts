import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../ability-engine/definition-types";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  hiddenCardChoiceOption,
  hiddenZoneChoicePayload,
  selectedHiddenCardChoiceIds,
} from "../choices/hidden-zone-choice";
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
export { startDataFortReclamationChoice } from "./scored-agenda/data-fort-reclamation-sequence";
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
  if (source.startsWith("v162.priority_requisition"))
    return resolvePriorityRequisitionChoice(host);
  if (isHqToNewRemoteInstallRezRezChoiceSource(source))
    return resolveHqToNewRemoteInstallRezRezChoice(host);
  if (isHqToNewRemoteInstallRezChoiceSource(source))
    return resolveHqToNewRemoteInstallRezChoice(host);
  if (isSecurityPurgeInstallTargetChoiceSource(source))
    return resolveSecurityPurgeInstallTargetChoice(host);
  return { handled: false };
}

export function startPriorityRequisitionChoice(
  host: CorpInstallRezSequenceHandlerHost,
  agendaId: CardInstanceId,
): CorpInstallRezSequenceHandlerResult {
  const candidates = priorityRequisitionCandidates(host);
  if (candidates.length === 0) {
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      priorityRequisitionChoiceOpened: false,
      priorityRequisitionCandidateCount: 0,
    };
    return { handled: true, resolvedPayload: host.legalAction.payload ?? {} };
  }
  host.state.pendingChoice = {
    choiceId: `v162_priority_requisition_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v162.priority_requisition:${agendaId}:${host.state.stateVersion + 1}`,
    prompt: "Priority Requisition: ICE kostenlos rezzen",
    kind: "select_cards",
    options: [
      ...candidates.map((cardId) =>
        hiddenCardChoiceOption({
          cardId,
          label: host.cards.definitionFor(cardId).title,
          publicLabel: "Installiertes ICE",
        }),
      ),
      {
        id: "skip",
        label: "Überspringen",
        publicLabel: "Überspringen",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    priorityRequisitionChoiceOpened: true,
    priorityRequisitionCandidateCount: candidates.length,
  };
  return { handled: true, stateChanged: true };
}

function resolvePriorityRequisitionChoice(
  host: CorpInstallRezSequenceHandlerHost,
): CorpInstallRezSequenceHandlerResult {
  const choice = requireChoice(
    host,
    "Es ist keine Priority-Requisition-Choice offen.",
  );
  if (host.legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Priority Requisition resolven.");
  const [, agendaId] = choice.source.split(":");
  if (
    !agendaId ||
    !host.state.corp.scoreArea.includes(agendaId as CardInstanceId) ||
    host.cards.scoredAgendaKind(agendaId as CardInstanceId) !==
      "score_rez_installed_ice_at_no_cost"
  ) {
    throw new Error(
      "Priority Requisition ist nicht mehr in der Korp-ScoreArea.",
    );
  }
  const selectedOptionIds = selectedChoiceIds(
    requirePlayerAction(host).selectedChoices,
  );
  if (selectedOptionIds.length === 1 && selectedOptionIds[0] === "skip") {
    delete host.state.pendingChoice;
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      priorityRequisitionFreeRez: false,
      priorityRequisitionDeclined: true,
    };
    return {
      handled: true,
      stateChanged: true,
      deletePendingChoice: true,
      resolvedPayload: host.legalAction.payload ?? {},
    };
  }
  const selectedIds = selectedChoiceCardIds(host, choice);
  if (selectedIds.length > 1)
    throw new Error("Priority Requisition darf hoechstens ein ICE rezzen.");
  const targetId = selectedIds[0];
  if (!targetId) {
    delete host.state.pendingChoice;
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      priorityRequisitionFreeRez: false,
      priorityRequisitionDeclined: true,
    };
    return {
      handled: true,
      stateChanged: true,
      deletePendingChoice: true,
      resolvedPayload: host.legalAction.payload ?? {},
    };
  }
  const optionValues = new Set(
    choice.options
      .map((option) => option.value)
      .filter((value): value is string => typeof value === "string"),
  );
  if (
    !optionValues.has(targetId) ||
    !host.cards.isPriorityRequisitionCandidate(targetId)
  )
    throw new Error("Das Priority-Requisition-Ziel ist nicht mehr gueltig.");
  const instance = host.cards.mustInstance(targetId);
  host.state.cardInstances[targetId] = {
    ...instance,
    faceup: true,
    rezzed: true,
  };
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...hiddenZoneChoicePayload("v162_priority_requisition_free_rez"),
    priorityRequisitionFreeRez: true,
    priorityRequisitionTarget: targetId,
    priorityRequisitionTargetDefinitionId:
      host.cards.definitionFor(targetId).id,
    rezCostPaid: 0,
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    rezzedCardIds: [targetId],
    resolvedPayload: host.legalAction.payload ?? {},
  };
}

function priorityRequisitionCandidates(
  host: CorpInstallRezSequenceHandlerHost,
): CardInstanceId[] {
  return Object.keys(host.state.cardInstances)
    .filter((cardId): cardId is CardInstanceId =>
      host.cards.isPriorityRequisitionCandidate(cardId as CardInstanceId),
    )
    .sort((left, right) => {
      const leftCost = host.cards.definitionFor(left).rezCost ?? 0;
      const rightCost = host.cards.definitionFor(right).rezCost ?? 0;
      return rightCost - leftCost || left.localeCompare(right);
    });
}

function requireChoice(
  host: CorpInstallRezSequenceHandlerHost,
  message: string,
): ChoiceRequest {
  const choice = host.state.pendingChoice;
  if (!choice) throw new Error(message);
  return choice;
}

function requirePlayerAction(
  host: CorpInstallRezSequenceHandlerHost,
): PlayerAction {
  if (!host.playerAction) throw new Error("Diese Choice hat keine Auswahl.");
  return host.playerAction;
}

function selectedChoiceCardIds(
  host: CorpInstallRezSequenceHandlerHost,
  choice: ChoiceRequest,
): CardInstanceId[] {
  return selectedHiddenCardChoiceIds(
    requirePlayerAction(host).selectedChoices,
    choice,
  );
}
