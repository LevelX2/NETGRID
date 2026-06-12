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
export { startDataFortReclamationChoice } from "./scored-agenda/data-fort-reclamation-sequence";

type SequencePayload = Record<string, string | number | boolean>;
const SECURITY_PURGE_INSTALL_TARGET_CHOICE_SOURCE =
  "v1922.security_purge_install_targets";

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

function isSecurityPurgeInstallTargetChoiceSource(source: string): boolean {
  return source.startsWith(`${SECURITY_PURGE_INSTALL_TARGET_CHOICE_SOURCE}:`);
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

export function resolveSecurityPurgeAgendaPurge(
  host: CorpInstallRezSequenceHandlerHost,
  agendaId: CardInstanceId,
): CorpInstallRezSequenceHandlerResult {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  if (
    !host.state.corp.scoreArea.includes(agendaId) ||
    host.cards.scoredAgendaKind(agendaId) !==
      "reveal_top_rd_install_and_rez_ice_trash_rest"
  )
    throw new Error("Security Purge ist nicht mehr in der Korp-ScoreArea.");
  const revealedIds = host.state.corp.rd.slice(0, 3);
  const revealedIceIds = securityPurgeIceIds(host, revealedIds);
  const pendingTrashIds = revealedIds.filter(
    (cardId) => !revealedIceIds.includes(cardId),
  );
  const basePayload = securityPurgeBasePayload(host, agendaId, revealedIds);
  if (revealedIceIds.length > 0) {
    host.state.pendingChoice = {
      choiceId: `choice_security_purge_install_targets_${host.state.stateVersion + 1}`,
      side: "corp",
      source: `${SECURITY_PURGE_INSTALL_TARGET_CHOICE_SOURCE}:${agendaId}:${revealedIds.join(",")}:${host.state.stateVersion + 1}`,
      prompt: "Security Purge: Zielserver fuer aufgedeckte ICE waehlen.",
      kind: "select_option",
      options: securityPurgeInstallTargetOptions(host, revealedIceIds),
      minSelections: revealedIceIds.length,
      maxSelections: revealedIceIds.length,
      stateVersion: host.state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      ...basePayload,
      ...hiddenZoneChoicePayload("v1922_security_purge_rd_top3_target_choice"),
      revealedIceCount: revealedIceIds.length,
      pendingTrashCount: pendingTrashIds.length,
      installedIceCount: 0,
      trashedCount: 0,
      securityPurgeTargetChoiceOpened: true,
      securityPurgeTargetChoiceCount: revealedIceIds.length,
    };
    return {
      handled: true,
      stateChanged: true,
      shownCardDefinitionIds: revealedIds.map(
        (id) => host.cards.definitionFor(id).id,
      ),
      shownCount: revealedIds.length,
      resolvedPayload: host.legalAction.payload ?? {},
    };
  }
  const trashedIds: CardInstanceId[] = [];
  for (const cardId of revealedIds) {
    host.zones.removeFromAllZones(cardId);
    host.zones.moveCardToArchivesFaceup(cardId);
    trashedIds.push(cardId);
  }
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...basePayload,
    ...hiddenZoneChoicePayload("v1922_security_purge_rd_top3"),
    revealedIceCount: 0,
    pendingTrashCount: 0,
    installedIceCount: 0,
    trashedCount: trashedIds.length,
    securityPurgeTargetChoiceOpened: false,
    trashedDefinitionIds: trashedIds
      .map((id) => host.cards.definitionFor(id).id)
      .join(","),
  };
  return {
    handled: true,
    stateChanged: true,
    installedCardIds: [],
    trashedCardIds: trashedIds,
    shownCardDefinitionIds: revealedIds.map(
      (id) => host.cards.definitionFor(id).id,
    ),
    shownCount: revealedIds.length,
    resolvedPayload: host.legalAction.payload ?? {},
  };
}

function resolveSecurityPurgeInstallTargetChoice(
  host: CorpInstallRezSequenceHandlerHost,
): CorpInstallRezSequenceHandlerResult {
  const choice = requireChoice(
    host,
    "Security-Purge-Zielserver-Choice ist nicht offen.",
  );
  if (host.legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Security Purge resolven.");
  const [, agendaIdText, revealedText] = choice.source.split(":");
  const agendaId = agendaIdText as CardInstanceId | undefined;
  if (
    !agendaId ||
    !host.state.corp.scoreArea.includes(agendaId) ||
    host.cards.scoredAgendaKind(agendaId) !==
      "reveal_top_rd_install_and_rez_ice_trash_rest"
  )
    throw new Error("Security Purge ist nicht mehr in der Korp-ScoreArea.");
  const revealedIds = revealedText
    ? revealedText
        .split(",")
        .filter(Boolean)
        .map((id) => id as CardInstanceId)
    : [];
  validateSecurityPurgeRevealedCards(host, revealedIds);
  const revealedIceIds = securityPurgeIceIds(host, revealedIds);
  if (revealedIceIds.length === 0)
    throw new Error("Security Purge hat keine ICE-Zielwahl offen.");
  const targetByCardId = selectedSecurityPurgeTargets(
    host,
    choice,
    revealedIceIds,
  );
  const installedIce: Array<{
    cardId: CardInstanceId;
    server: CorpServer;
  }> = [];
  const trashedIds: CardInstanceId[] = [];
  for (const cardId of revealedIds) {
    host.zones.removeFromAllZones(cardId);
    const definition = host.cards.definitionFor(cardId);
    if (definition.type === "ice") {
      const selectedTarget = targetByCardId.get(cardId);
      if (!selectedTarget)
        throw new Error("Fuer ein Security-Purge-ICE fehlt der Zielserver.");
      const server =
        selectedTarget === "new_remote"
          ? host.servers.createRemote()
          : host.servers.mustServer(selectedTarget);
      server.ice.push(cardId);
      host.state.cardInstances[cardId] = {
        ...host.cards.mustInstance(cardId),
        faceup: true,
        rezzed: true,
        zone: { side: "corp", zone: "serverIce", serverId: server.id },
      };
      installedIce.push({ cardId, server });
      continue;
    }
    host.zones.moveCardToArchivesFaceup(cardId);
    trashedIds.push(cardId);
  }
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...securityPurgeBasePayload(host, agendaId, revealedIds),
    ...hiddenZoneChoicePayload("v1922_security_purge_install_targets"),
    revealedIceCount: installedIce.length,
    pendingTrashCount: 0,
    installedIceCount: installedIce.length,
    trashedCount: trashedIds.length,
    securityPurgeTargetChoiceOpened: false,
    securityPurgeTargetChoiceResolved: true,
    installedIceDefinitionIds: installedIce
      .map((entry) => host.cards.definitionFor(entry.cardId).id)
      .join(","),
    installedIceServerLabels: installedIce
      .map((entry) => entry.server.label)
      .join(","),
    trashedDefinitionIds: trashedIds
      .map((id) => host.cards.definitionFor(id).id)
      .join(","),
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    installedCardIds: installedIce.map((entry) => entry.cardId),
    rezzedCardIds: installedIce.map((entry) => entry.cardId),
    trashedCardIds: trashedIds,
    shownCardDefinitionIds: revealedIds.map(
      (id) => host.cards.definitionFor(id).id,
    ),
    shownCount: revealedIds.length,
    resolvedPayload: host.legalAction.payload ?? {},
  };
}

function securityPurgeBasePayload(
  host: CorpInstallRezSequenceHandlerHost,
  agendaId: CardInstanceId,
  revealedIds: readonly CardInstanceId[],
): SequencePayload {
  return {
    agendaAbility: "v1922_security_purge",
    sourceDefinitionId: host.cards.definitionFor(agendaId).id,
    ...hiddenZoneChoicePayload("v1922_security_purge"),
    publicRevealKind: "reveal",
    revealedCount: revealedIds.length,
    securityPurgeInstallContract: "corp_server_choice_per_ice",
    securityPurgeWaivesPrintedRezCosts: true,
    publicRevealDefinitionIds: revealedIds
      .map((id) => host.cards.definitionFor(id).id)
      .join(","),
  };
}

function securityPurgeIceIds(
  host: CorpInstallRezSequenceHandlerHost,
  revealedIds: readonly CardInstanceId[],
): CardInstanceId[] {
  return revealedIds.filter((cardId) => {
    const definition = host.cards.definitionFor(cardId);
    return definition.type === "ice";
  });
}

function securityPurgeInstallTargetOptions(
  host: CorpInstallRezSequenceHandlerHost,
  iceIds: readonly CardInstanceId[],
): ChoiceRequest["options"] {
  const serverTargets: Array<{
    serverId: ServerId;
    label: string;
  }> = [
    ...host.state.corp.servers.map((server) => ({
      serverId: server.id,
      label: server.label,
    })),
    { serverId: "new_remote", label: "neues Remote" },
  ];
  return iceIds.flatMap((cardId) => {
    const title = host.cards.definitionFor(cardId).title;
    return serverTargets.map((target) => ({
      id: `security_purge_${cardId}_${target.serverId}`,
      label: `${title}: ${securityPurgeTargetLabel(target)}`,
      publicLabel: "Security-Purge-Zielserver",
      value: `${cardId}|${target.serverId}`,
    }));
  });
}

function securityPurgeTargetLabel(target: {
  serverId: ServerId;
  label: string;
}): string {
  return target.serverId === "new_remote"
    ? "in neues Remote installieren"
    : `vor ${target.label} installieren`;
}

function validateSecurityPurgeRevealedCards(
  host: CorpInstallRezSequenceHandlerHost,
  revealedIds: readonly CardInstanceId[],
): void {
  if (revealedIds.length > 3)
    throw new Error("Security Purge darf hoechstens drei R&D-Karten zeigen.");
  for (const [index, cardId] of revealedIds.entries()) {
    if (host.state.corp.rd[index] !== cardId)
      throw new Error("Die Security-Purge-R&D-Karten sind nicht mehr gueltig.");
  }
}

function selectedSecurityPurgeTargets(
  host: CorpInstallRezSequenceHandlerHost,
  choice: ChoiceRequest,
  iceIds: readonly CardInstanceId[],
): Map<CardInstanceId, ServerId> {
  const iceIdSet = new Set<CardInstanceId>(iceIds);
  const selectedOptionIds = selectedChoiceIds(
    requirePlayerAction(host).selectedChoices,
  );
  if (selectedOptionIds.length !== iceIds.length)
    throw new Error("Security Purge braucht fuer jedes ICE genau ein Ziel.");
  const optionById = new Map(
    choice.options.map((option) => [option.id, option]),
  );
  const targetByCardId = new Map<CardInstanceId, ServerId>();
  for (const optionId of selectedOptionIds) {
    const option = optionById.get(optionId);
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Security-Purge-Option ist ungueltig.");
    const [cardIdText, serverIdText] = option.value.split("|");
    const cardId = cardIdText as CardInstanceId | undefined;
    const serverId = serverIdText as ServerId | undefined;
    if (!cardId || !serverId || !iceIdSet.has(cardId))
      throw new Error("Die gewaehlte Security-Purge-Option ist ungueltig.");
    if (targetByCardId.has(cardId))
      throw new Error("Ein Security-Purge-ICE hat mehrere Zielserver.");
    if (serverId !== "new_remote") host.servers.mustServer(serverId);
    targetByCardId.set(cardId, serverId);
  }
  for (const cardId of iceIds) {
    if (!targetByCardId.has(cardId))
      throw new Error("Fuer ein Security-Purge-ICE fehlt der Zielserver.");
  }
  return targetByCardId;
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
