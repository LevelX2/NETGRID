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
import {
  cardImplementationPrimitivePayload,
  type HqToNewRemoteInstallRezSequence,
} from "../../ability-engine/card-implementation-primitives";
import type { CardScoredAgendaImplementation } from "../../ability-engine/definition-types";

type SequencePayload = Record<string, string | number | boolean>;
const HQ_TO_NEW_REMOTE_INSTALL_REZ_SOURCE =
  "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez";
const HQ_TO_NEW_REMOTE_INSTALL_REZ_REZ_SOURCE =
  "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez";
const SECURITY_PURGE_INSTALL_TARGET_CHOICE_SOURCE =
  "v1922.security_purge_install_targets";

type PrevalidatedHqToNewRemoteInstall = {
  cardId: CardInstanceId;
  definition: CardDefinition;
  destination: "ice" | "root";
};

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

function requireHqToNewRemoteInstallRezSequence(
  host: CorpInstallRezSequenceHandlerHost,
  agendaId: CardInstanceId,
): HqToNewRemoteInstallRezSequence {
  const sequence = host.cards.scoredAgendaForCard(agendaId);
  if (
    sequence?.kind !== "score_install_hq_cards_into_new_remote_then_rez" ||
    sequence.sourceZone !== "hq" ||
    sequence.targetServer !== "new_remote" ||
    sequence.allowedCards !== "corp_installable" ||
    !Number.isInteger(sequence.maxCards) ||
    sequence.maxCards < 0 ||
    sequence.temporaryCredits.amount < 0 ||
    sequence.temporaryCredits.usableFor !==
      "rez_installed_cards_from_sequence" ||
    sequence.temporaryCredits.returnUnused !== true ||
    sequence.optionalRez !== true
  )
    throw new Error(
      "Der Hidden-Zone-Install-/Rez-Sequenzvertrag ist ungueltig.",
    );
  return sequence;
}

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

function isHqToNewRemoteInstallRezChoiceSource(source: string): boolean {
  return (
    source.startsWith(`${HQ_TO_NEW_REMOTE_INSTALL_REZ_SOURCE}:`) ||
    source.startsWith("v1922.data_fort_reclamation")
  );
}

function isHqToNewRemoteInstallRezRezChoiceSource(source: string): boolean {
  return (
    source.startsWith(`${HQ_TO_NEW_REMOTE_INSTALL_REZ_REZ_SOURCE}:`) ||
    source.startsWith("v1922.data_fort_reclamation_rez")
  );
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
      ...candidates.map((cardId) => ({
        id: `card_${cardId}`,
        label: host.cards.definitionFor(cardId).title,
        publicLabel: "Installiertes ICE",
        value: cardId,
      })),
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
      hiddenZoneAction: "v1922_security_purge_rd_top3_target_choice",
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
    hiddenZoneAction: "v1922_security_purge_rd_top3",
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
    hiddenZoneAction: "v1922_security_purge_install_targets",
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
    hiddenZoneBarrier: true,
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

export function startDataFortReclamationChoice(
  host: CorpInstallRezSequenceHandlerHost,
  agendaId: CardInstanceId,
): CorpInstallRezSequenceHandlerResult {
  const sequence = requireHqToNewRemoteInstallRezSequence(host, agendaId);
  const agendaDefinition = host.cards.definitionFor(agendaId);
  const primitivePayload = cardImplementationPrimitivePayload({
    sourceCardId: agendaId,
    sourceDefinitionId: agendaDefinition.id,
    primitiveKind: sequence.kind,
    effectKind: "install_rez_sequence",
    abilityKey: sequence.abilityKey,
  });
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  const options = host.state.corp.hq
    .filter((cardId) =>
      host.cards.isCorpInstallableCardType(host.cards.definitionFor(cardId)),
    )
    .sort()
    .map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (options.length === 0) {
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      ...primitivePayload,
      v1922CorpAgendaAbility: "data_fort_reclamation",
      sourceAgendaId: agendaId,
      dataFortReclamationChoiceOpened: false,
      dataFortReclamationCandidateCount: 0,
    };
    return { handled: true, resolvedPayload: host.legalAction.payload ?? {} };
  }
  host.state.pendingChoice = {
    choiceId: `choice_card_implementation_hq_to_new_remote_install_rez_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `${HQ_TO_NEW_REMOTE_INSTALL_REZ_SOURCE}:${agendaId}:${host.state.stateVersion + 1}`,
    prompt: "Data Fort Reclamation: HQ-Karten fuer neues Data Fort waehlen.",
    kind: "select_cards",
    options,
    minSelections: 0,
    maxSelections: Math.min(sequence.maxCards, options.length),
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...primitivePayload,
    v1922CorpAgendaAbility: "data_fort_reclamation",
    sourceAgendaId: agendaId,
    cardImplementationSourceZone: sequence.sourceZone,
    cardImplementationTargetServer: sequence.targetServer,
    cardImplementationAllowedCards: sequence.allowedCards,
    cardImplementationMaxCards: sequence.maxCards,
    cardImplementationTemporaryCreditBudget: sequence.temporaryCredits.amount,
    dataFortReclamationChoiceOpened: true,
    dataFortReclamationCandidateCount: options.length,
    dataFortReclamationMaxSelections: Math.min(
      sequence.maxCards,
      options.length,
    ),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_data_fort_reclamation_hq_choice",
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
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v162_priority_requisition_free_rez",
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

/**
 * @mvpBoundary This path installs selected HQ cards first and opens one
 * follow-up rez choice. Region replacement and required root rez-on-install
 * now run inside the ordered install/rez sequence. A fully interactive
 * optional rez choice after each individual non-required card remains deferred.
 */
function resolveHqToNewRemoteInstallRezChoice(
  host: CorpInstallRezSequenceHandlerHost,
): CorpInstallRezSequenceHandlerResult {
  const choice = requireChoice(
    host,
    "HQ-to-new-remote-Install-Choice ist nicht offen.",
  );
  const [, agendaId] = choice.source.split(":");
  if (
    !agendaId ||
    !host.state.corp.scoreArea.includes(agendaId as CardInstanceId) ||
    host.cards.scoredAgendaKind(agendaId as CardInstanceId) !==
      "score_install_hq_cards_into_new_remote_then_rez"
  )
    throw new Error(
      "Das HQ-to-new-remote-Install-/Rez-Primitive ist nicht gescored.",
    );
  const sequence = requireHqToNewRemoteInstallRezSequence(
    host,
    agendaId as CardInstanceId,
  );
  const primitivePayload = cardImplementationPrimitivePayload({
    sourceCardId: agendaId as CardInstanceId,
    sourceDefinitionId: host.cards.definitionFor(agendaId as CardInstanceId).id,
    primitiveKind: sequence.kind,
    effectKind: "install_rez_sequence",
    abilityKey: sequence.abilityKey,
  });
  const selectedIds = selectedChoiceCardIds(host, choice);
  if (
    selectedIds.length > choice.maxSelections ||
    selectedIds.length > sequence.maxCards
  )
    throw new Error(
      "Das HQ-to-new-remote-Install-Primitive darf hoechstens vier HQ-Karten waehlen.",
    );
  const selectedSet = new Set(selectedIds);
  if (selectedSet.size !== selectedIds.length)
    throw new Error("Eine HQ-Karte wurde doppelt gewaehlt.");
  const selectedCards = prevalidateHqToNewRemoteInstallSelection(
    host,
    selectedIds,
  );
  const temporaryCreditAmount = sequence.temporaryCredits.amount;
  validateImmediateRootRezBudget(host, selectedCards, temporaryCreditAmount);
  if (selectedCards.length === 0) {
    delete host.state.pendingChoice;
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      ...primitivePayload,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_data_fort_reclamation_install_sequence",
      sourceAgendaId: agendaId,
      selectedCount: 0,
      installedCount: 0,
      installedIceCount: 0,
      installedRootCount: 0,
      cardImplementationTemporaryCreditBudget: temporaryCreditAmount,
      temporaryCreditsProvided: temporaryCreditAmount,
      temporaryCreditsSpent: 0,
      corpCreditsSpent: 0,
      temporaryCreditsRemaining: temporaryCreditAmount,
      temporaryCreditsReturned: temporaryCreditAmount,
      dataFortReclamationRezChoiceOpened: false,
      dataFortReclamationRezCandidateCount: 0,
    };
    return {
      handled: true,
      stateChanged: true,
      deletePendingChoice: true,
      selectedCardIds: [],
      installedCardIds: [],
      temporaryCreditsGranted: temporaryCreditAmount,
      temporaryCreditsReturned: temporaryCreditAmount,
      resolvedPayload: host.legalAction.payload ?? {},
    };
  }

  const server = host.servers.createRemote();
  const installedIds: CardInstanceId[] = [];
  const immediateRezzedIds: CardInstanceId[] = [];
  let temporaryCreditsRemaining = temporaryCreditAmount;
  let temporaryCreditsSpent = 0;
  let corpCreditsSpent = 0;
  for (const { cardId, definition, destination } of selectedCards) {
    host.zones.removeFromAllZones(cardId);
    if (destination === "ice") {
      server.ice.push(cardId);
      host.state.cardInstances[cardId] = {
        ...host.cards.mustInstance(cardId),
        faceup: false,
        rezzed: false,
        zone: { side: "corp", zone: "serverIce", serverId: server.id },
      };
      installedIds.push(cardId);
      continue;
    }
    server.root.push(cardId);
    const rootRezOnInstall = requiresOrderedRootInstallRezSequence(
      host,
      definition,
    );
    if (rootRezOnInstall) {
      const payment = spendDataFortReclamationRezCost(
        host,
        cardId,
        temporaryCreditsRemaining,
      );
      temporaryCreditsRemaining = payment.temporaryCreditsRemaining;
      temporaryCreditsSpent += payment.temporaryCreditsSpent;
      corpCreditsSpent += payment.corpCreditsSpent;
    }
    host.state.cardInstances[cardId] = {
      ...host.cards.mustInstance(cardId),
      faceup: rootRezOnInstall,
      rezzed: rootRezOnInstall,
      zone: { side: "corp", zone: "serverRoot", serverId: server.id },
    };
    if (rootRezOnInstall) {
      immediateRezzedIds.push(cardId);
      host.callbacks.resolveCorpRootRez(cardId);
      if (host.cards.isRegionUpgrade(definition))
        host.servers.trashOlderRegionUpgradesInServer(
          server,
          cardId,
          host.legalAction,
        );
    }
    installedIds.push(cardId);
  }
  const installedIceCount = selectedCards.filter(
    (card) => card.destination === "ice",
  ).length;
  const installedRootCount = selectedCards.length - installedIceCount;
  const rezCandidates = installedIds.filter((cardId) =>
    isDataFortReclamationRezCandidate(host, cardId, server.id),
  );
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...primitivePayload,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_data_fort_reclamation_install_sequence",
    sourceAgendaId: agendaId,
    selectedCount: selectedIds.length,
    installedCount: installedIceCount + installedRootCount,
    installedIceCount,
    installedRootCount,
    createdServerId: server.id,
    cardImplementationSequenceCreatedServerId: server.id,
    cardImplementationTemporaryCreditBudget: temporaryCreditAmount,
    temporaryCreditsProvided: temporaryCreditAmount,
    temporaryCreditsSpent,
    corpCreditsSpent,
    temporaryCreditsRemaining,
    immediateRezzedCount: immediateRezzedIds.length,
    dataFortReclamationRezChoiceOpened: rezCandidates.length > 0,
    dataFortReclamationRezCandidateCount: rezCandidates.length,
    ...(rezCandidates.length === 0
      ? { temporaryCreditsReturned: temporaryCreditsRemaining }
      : {}),
  };
  if (rezCandidates.length > 0) {
    host.state.pendingChoice = {
      choiceId: `choice_card_implementation_hq_to_new_remote_install_rez_rez_${host.state.stateVersion + 1}`,
      side: "corp",
      source: `${HQ_TO_NEW_REMOTE_INSTALL_REZ_REZ_SOURCE}:${agendaId}:${server.id}:${temporaryCreditsRemaining}:${host.state.stateVersion + 1}`,
      prompt: "Data Fort Reclamation: installierte Karten rezzen.",
      kind: "select_cards",
      options: rezCandidates.sort().map((cardId) => {
        const definition = host.cards.definitionFor(cardId);
        return { id: `card_${cardId}`, label: definition.title, value: cardId };
      }),
      minSelections: 0,
      maxSelections: rezCandidates.length,
      stateVersion: host.state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
  }
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: rezCandidates.length === 0,
    createdServerId: server.id,
    selectedCardIds: selectedIds,
    installedCardIds: installedIds,
    rezzedCardIds: immediateRezzedIds,
    temporaryCreditsGranted: temporaryCreditAmount,
    ...(rezCandidates.length === 0
      ? { temporaryCreditsReturned: temporaryCreditsRemaining }
      : {}),
    resolvedPayload: host.legalAction.payload ?? {},
  };
}

function prevalidateHqToNewRemoteInstallSelection(
  host: CorpInstallRezSequenceHandlerHost,
  selectedIds: readonly CardInstanceId[],
): PrevalidatedHqToNewRemoteInstall[] {
  const simulatedServer: CorpServer = {
    id: "new_remote_preview" as Exclude<ServerId, "new_remote">,
    label: "New Remote Preview",
    kind: "remote",
    ice: [],
    root: [],
  };
  const selectedCards: PrevalidatedHqToNewRemoteInstall[] = [];
  for (const cardId of selectedIds) {
    if (!host.state.corp.hq.includes(cardId))
      throw new Error("Eine gewaehlte Karte liegt nicht mehr in HQ.");
    const definition = host.cards.definitionFor(cardId);
    if (!host.cards.isCorpInstallableCardType(definition))
      throw new Error("Eine gewaehlte Karte ist nicht installierbar.");
    if (definition.type === "ice") {
      simulatedServer.ice.push(cardId);
      selectedCards.push({ cardId, definition, destination: "ice" });
      continue;
    }
    if (!host.cards.canInstallCorpRootCardInServer(definition, simulatedServer))
      throw new Error("Diese Root-Karte kann nicht in das neue Remote.");
    simulatedServer.root.push(cardId);
    selectedCards.push({ cardId, definition, destination: "root" });
  }
  return selectedCards;
}

function validateImmediateRootRezBudget(
  host: CorpInstallRezSequenceHandlerHost,
  selectedCards: readonly PrevalidatedHqToNewRemoteInstall[],
  temporaryCreditAmount: number,
): void {
  let temporaryCreditsRemaining = temporaryCreditAmount;
  let corpCreditsAvailable = host.state.corp.credits;
  for (const { cardId, definition, destination } of selectedCards) {
    if (
      destination !== "root" ||
      !requiresOrderedRootInstallRezSequence(host, definition)
    )
      continue;
    const rezCost = host.cards.rezCostForCard(cardId);
    const temporary = Math.min(temporaryCreditsRemaining, rezCost);
    const corp = rezCost - temporary;
    if (corpCreditsAvailable < corp)
      throw new Error(
        "Die Korp kann die Data-Fort-Reclamation-Rez-on-install-Kosten nicht bezahlen.",
      );
    temporaryCreditsRemaining -= temporary;
    corpCreditsAvailable -= corp;
  }
}

function requiresOrderedRootInstallRezSequence(
  host: CorpInstallRezSequenceHandlerHost,
  definition: CardDefinition,
): boolean {
  return (
    host.cards.isRegionUpgrade(definition) ||
    host.cards.rootInstallRezzesOnInstall(definition)
  );
}

function resolveHqToNewRemoteInstallRezRezChoice(
  host: CorpInstallRezSequenceHandlerHost,
): CorpInstallRezSequenceHandlerResult {
  const choice = requireChoice(
    host,
    "HQ-to-new-remote-Install-/Rez-Choice ist nicht offen.",
  );
  const [, agendaId, serverId, temporaryCreditText] = choice.source.split(":");
  if (
    !serverId ||
    !agendaId ||
    !host.state.corp.scoreArea.includes(agendaId as CardInstanceId) ||
    host.cards.scoredAgendaKind(agendaId as CardInstanceId) !==
      "score_install_hq_cards_into_new_remote_then_rez"
  )
    throw new Error(
      "Das HQ-to-new-remote-Install-/Rez-Primitive ist nicht gescored.",
    );
  const sequence = requireHqToNewRemoteInstallRezSequence(
    host,
    agendaId as CardInstanceId,
  );
  const primitivePayload = cardImplementationPrimitivePayload({
    sourceCardId: agendaId as CardInstanceId,
    sourceDefinitionId: host.cards.definitionFor(agendaId as CardInstanceId).id,
    primitiveKind: sequence.kind,
    effectKind: "install_rez_sequence",
    abilityKey: sequence.abilityKey,
  });
  host.servers.mustServer(serverId);
  const temporaryCreditAmount = sequence.temporaryCredits.amount;
  const parsedTemporaryCredits = Math.floor(Number(temporaryCreditText));
  if (
    !Number.isInteger(parsedTemporaryCredits) ||
    parsedTemporaryCredits < 0 ||
    parsedTemporaryCredits > temporaryCreditAmount
  )
    throw new Error(
      "Die temporaeren Rez-Credits passen nicht zum Install-/Rez-Primitive.",
    );
  let temporaryCreditsRemaining = parsedTemporaryCredits;
  const selectedIds = selectedChoiceCardIds(host, choice);
  const selectedSet = new Set(selectedIds);
  if (selectedSet.size !== selectedIds.length)
    throw new Error("Eine Rez-Karte wurde doppelt gewaehlt.");
  if (
    selectedIds.some(
      (cardId) => !isDataFortReclamationRezCandidate(host, cardId, serverId),
    )
  )
    throw new Error("Eine gewaehlte Karte kann nicht gerezzed werden.");

  let temporaryCreditsSpent = 0;
  let corpCreditsSpent = 0;
  let rezzedIceCount = 0;
  let rezzedRootCount = 0;
  for (const cardId of selectedIds) {
    const payment = spendDataFortReclamationRezCost(
      host,
      cardId,
      temporaryCreditsRemaining,
    );
    temporaryCreditsRemaining = payment.temporaryCreditsRemaining;
    temporaryCreditsSpent += payment.temporaryCreditsSpent;
    corpCreditsSpent += payment.corpCreditsSpent;
    const definition = host.cards.definitionFor(cardId);
    const instance = host.cards.mustInstance(cardId);
    host.state.cardInstances[cardId] = {
      ...instance,
      faceup: true,
      rezzed: true,
    };
    if (definition.type === "ice") {
      rezzedIceCount += 1;
    } else {
      rezzedRootCount += 1;
      host.callbacks.resolveCorpRootRez(cardId);
    }
  }
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...primitivePayload,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_data_fort_reclamation_rez_sequence",
    sourceAgendaId: agendaId,
    cardImplementationSequenceCreatedServerId: serverId,
    cardImplementationTemporaryCreditBudget: temporaryCreditAmount,
    selectedCount: selectedIds.length,
    rezzedCount: rezzedIceCount + rezzedRootCount,
    rezzedIceCount,
    rezzedRootCount,
    temporaryCreditsProvided: temporaryCreditAmount,
    temporaryCreditsSpent,
    temporaryCreditsRemaining,
    corpCreditsSpent,
    corpCreditsAfter: host.state.corp.credits,
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    rezzedCardIds: selectedIds,
    temporaryCreditsGranted: temporaryCreditAmount,
    temporaryCreditsReturned: temporaryCreditsRemaining,
    resolvedPayload: host.legalAction.payload ?? {},
  };
}

function spendDataFortReclamationRezCost(
  host: CorpInstallRezSequenceHandlerHost,
  cardId: CardInstanceId,
  temporaryCreditsRemaining: number,
): {
  temporaryCreditsSpent: number;
  temporaryCreditsRemaining: number;
  corpCreditsSpent: number;
} {
  const rezCost = host.cards.rezCostForCard(cardId);
  const temporaryCreditsSpent = Math.min(temporaryCreditsRemaining, rezCost);
  const corpCreditsSpent = rezCost - temporaryCreditsSpent;
  if (host.state.corp.credits < corpCreditsSpent)
    throw new Error(
      "Die Korp kann die Install-/Rez-Primitive-Rez-Kosten nicht bezahlen.",
    );
  if (corpCreditsSpent > 0) host.credits.spendCorpCredits(corpCreditsSpent);
  return {
    temporaryCreditsSpent,
    temporaryCreditsRemaining:
      temporaryCreditsRemaining - temporaryCreditsSpent,
    corpCreditsSpent,
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

function isDataFortReclamationRezCandidate(
  host: CorpInstallRezSequenceHandlerHost,
  cardId: CardInstanceId,
  serverId: string,
): boolean {
  const instance = host.cards.mustInstance(cardId);
  const definition = host.cards.definitionFor(cardId);
  if (instance.rezzed) return false;
  if (instance.zone.side !== "corp") return false;
  if (instance.zone.zone !== "serverIce" && instance.zone.zone !== "serverRoot")
    return false;
  if (instance.zone.serverId !== serverId) return false;
  if (definition.type === "ice") return instance.zone.zone === "serverIce";
  return (
    instance.zone.zone === "serverRoot" &&
    (definition.type === "asset" || definition.type === "upgrade")
  );
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
  return selectedChoiceIds(requirePlayerAction(host).selectedChoices).map(
    (optionId) => {
      const option = choice.options.find(
        (candidate) => candidate.id === optionId,
      );
      if (typeof option?.value !== "string")
        throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
      return option.value;
    },
  );
}

function selectedChoiceIds(
  selectedChoices: PlayerAction["selectedChoices"],
): string[] {
  const raw =
    selectedChoices?.selectedOptionIds ??
    selectedChoices?.optionIds ??
    selectedChoices?.options ??
    selectedChoices?.selectedOptions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string");
}
