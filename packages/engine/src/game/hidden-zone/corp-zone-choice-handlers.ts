import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";

type HiddenZonePayload = Record<string, string | number | boolean>;

export type CorpZoneChoiceHandlerHost = {
  state: Pick<
    GameState,
    | "corp"
    | "cardInstances"
    | "pendingChoice"
    | "pendingCorpDraw"
    | "stateVersion"
    | "randomCounter"
  >;
  legalAction: LegalAction;
  playerAction?: PlayerAction;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    hasLifecycleEffect: (
      cardId: CardInstanceId,
      effectKind: "show_hq_agendas_for_credits",
    ) => boolean;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    scoredAgendaKind: (cardId: CardInstanceId) => string | undefined;
    scoredAgendaCreditPerAgendaPoint: (
      cardId: CardInstanceId,
    ) => number | undefined;
    lifecycleCreditPerRevealedAgenda: (
      cardId: CardInstanceId,
    ) => number | undefined;
    scoredAgendaDrawCount: (cardId: CardInstanceId) => number;
  };
  zones: {
    rezzedCorpRootCardIds: () => CardInstanceId[];
    shuffleCorpRnd: (
      cardIds: CardInstanceId[],
      randomPurpose: string,
    ) => CardInstanceId[];
  };
  credits: {
    gainCorpCredits: (amount: number) => void;
  };
  draw: {
    drawCorpCards: (amount: number) => void;
  };
};

export type CorpZoneChoiceHandlerResult = {
  handled: boolean;
  stateChanged?: boolean;
  deletePendingChoice?: boolean;
  selectedCardIds?: CardInstanceId[];
  shownCardDefinitionIds?: CardDefinitionId[];
  shownCount?: number;
  shuffledIntoRndCount?: number;
  combinedAgendaPoints?: number;
  gainedCredits?: number;
  drawCount?: number;
  sourceZoneCounts?: {
    hq?: number;
    archives?: number;
  };
  resolvedPayload?: HiddenZonePayload;
};

export function handleCorpZoneChoice(
  host: CorpZoneChoiceHandlerHost,
): CorpZoneChoiceHandlerResult {
  const source = host.state.pendingChoice?.source ?? "";
  if (source.startsWith("v1917.corp_hq_agenda_reveal"))
    return resolveCorpHqAgendaRevealChoice(host);
  if (source.startsWith("p3_36.show_hq_agendas_for_credits"))
    return resolveShowHqAgendasForCreditsChoice(host);
  if (source.startsWith("scored_agenda.hq_agenda_shuffle_credits"))
    return resolveScoredAgendaHqShuffleCreditsChoice(host);
  return { handled: false };
}

export function startCorpHqAgendaRevealChoice(
  host: CorpZoneChoiceHandlerHost,
): void {
  const sourceIds = host.zones
    .rezzedCorpRootCardIds()
    .filter((cardId) => {
      return host.cards.hasLifecycleEffect(
        cardId,
        "show_hq_agendas_for_credits",
      );
    })
    .sort();
  if (sourceIds.length === 0) return;
  const agendaIds = hqAgendaIds(host);
  if (agendaIds.length === 0) return;
  host.state.pendingChoice = {
    choiceId: `v1917_corp_hq_agenda_reveal_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v1917.corp_hq_agenda_reveal:${sourceIds.join(",")}:${host.state.stateVersion + 1}`,
    prompt: "HQ-Agenden zeigen",
    kind: "select_cards",
    options: agendaChoiceOptions(host, agendaIds),
    minSelections: 0,
    maxSelections: agendaIds.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

export function startShowHqAgendasForCreditsChoice(
  host: CorpZoneChoiceHandlerHost,
  input: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    creditPerAgenda: number;
  },
): { publicPayload: HiddenZonePayload } {
  if (host.state.pendingChoice) return { publicPayload: {} };
  if (
    !host.zones.rezzedCorpRootCardIds().includes(input.sourceCardId) ||
    host.cards.definitionFor(input.sourceCardId).id !== input.sourceDefinitionId
  )
    return { publicPayload: {} };
  const agendaIds = hqAgendaIds(host);
  if (agendaIds.length === 0) return { publicPayload: {} };
  host.state.pendingChoice = {
    choiceId: `p3_36_show_hq_agendas_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `p3_36.show_hq_agendas_for_credits:${input.sourceCardId}:${input.sourceDefinitionId}:${input.creditPerAgenda}:${host.state.stateVersion + 1}`,
    sourceCardInstanceId: input.sourceCardId,
    sourceCardDefinitionId: input.sourceDefinitionId,
    continuation: {
      family: "corp_hq_agenda_reveal_credits",
      originActionId: host.legalAction.actionId ?? "",
      sourceCardInstanceId: input.sourceCardId,
      sourceCardDefinitionId: input.sourceDefinitionId,
      creditPerRevealedAgenda: input.creditPerAgenda,
      createdAtStateVersion: host.state.stateVersion + 1,
    },
    prompt: "HQ-Agenden zeigen",
    kind: "select_cards",
    options: agendaChoiceOptions(host, agendaIds),
    minSelections: 0,
    maxSelections: agendaIds.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  return {
    publicPayload: {
      hiddenZoneBarrier: true,
      hiddenZoneAction: "corp_hq_agenda_reveal_choice",
      sourceDefinitionId: input.sourceDefinitionId,
      creditPerAgenda: input.creditPerAgenda,
    },
  };
}

export function startScoredAgendaHqShuffleCreditsChoice(
  host: CorpZoneChoiceHandlerHost,
  input: {
    sourceCardId: CardInstanceId;
    creditPerAgendaPoint: number;
  },
): void {
  if (host.state.pendingChoice) return;
  if (
    !host.state.corp.scoreArea.includes(input.sourceCardId) ||
    host.cards.scoredAgendaKind(input.sourceCardId) !==
      "shuffle_selected_hq_agendas_into_rd_gain_credits" ||
    !Number.isInteger(input.creditPerAgendaPoint) ||
    input.creditPerAgendaPoint < 0
  )
    return;
  const agendaIds = hqAgendaIds(host);
  if (agendaIds.length === 0) {
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      agendaAbility: "scored_agenda_hq_agenda_shuffle_credits",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "scored_agenda_hq_agenda_shuffle_credits",
      hiddenZoneMutationKind: "shuffle",
      hiddenZoneAffectedCardCount: 0,
      hiddenZoneContentsChanged: false,
      hiddenZoneOrderChanged: false,
      hiddenZoneChangesHq: false,
      hiddenZoneChangesRd: false,
      shownCount: 0,
      shuffledIntoRndCount: 0,
      gainedCredits: 0,
      corpCreditsAfter: host.state.corp.credits,
    };
    return;
  }
  host.state.pendingChoice = {
    choiceId: `scored_agenda_hq_agenda_shuffle_credits_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `scored_agenda.hq_agenda_shuffle_credits:${input.sourceCardId}:${input.creditPerAgendaPoint}:${host.state.stateVersion + 1}`,
    sourceCardInstanceId: input.sourceCardId,
    sourceCardDefinitionId: host.cards.definitionFor(input.sourceCardId).id,
    continuation: {
      family: "corp_scored_agenda_hq_shuffle",
      originActionId: host.legalAction.actionId ?? "",
      agendaInstanceId: input.sourceCardId,
      creditPerAgendaPoint: input.creditPerAgendaPoint,
      createdAtStateVersion: host.state.stateVersion + 1,
    },
    prompt: "Scored Agenda: HQ-Agenden zeigen",
    kind: "select_cards",
    options: agendaChoiceOptions(host, agendaIds),
    minSelections: 0,
    maxSelections: agendaIds.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    agendaAbility: "scored_agenda_hq_agenda_shuffle_credits_choice",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "scored_agenda_hq_agenda_shuffle_credits",
    hqAgendaChoiceCount: agendaIds.length,
  };
}

export function resolveReschedulerHqShuffleDraw(
  host: CorpZoneChoiceHandlerHost,
  sourceCardId: CardInstanceId,
): CorpZoneChoiceHandlerResult {
  const hqCards = host.state.corp.hq.slice();
  const hqCardCount = hqCards.length;
  const randomPurpose = `v1917.rescheduler.hq_into_rd.${sourceCardId}.${host.state.stateVersion + 1}`;
  host.state.corp.hq = [];
  host.state.corp.rd = host.zones.shuffleCorpRnd(
    [...host.state.corp.rd, ...hqCards],
    randomPurpose,
  );
  refreshCorpRndZones(host);
  host.draw.drawCorpCards(hqCardCount);
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_rescheduler_hq_shuffle_draw",
    hiddenZoneMutationKind: "shuffle",
    hiddenZoneAffectedCardCount: hqCardCount,
    hiddenZoneContentsChanged: hqCardCount > 0,
    hiddenZoneOrderChanged: hqCardCount > 0,
    hiddenZoneChangesHq: hqCardCount > 0,
    hiddenZoneChangesRd: hqCardCount > 0,
    hqCardCount,
    drawnCount: hqCardCount,
    randomDrawRecordPurpose: randomPurpose,
    randomCounterAfter: host.state.randomCounter,
  };
  return {
    handled: true,
    stateChanged: true,
    drawCount: hqCardCount,
    sourceZoneCounts: { hq: hqCardCount },
    resolvedPayload: host.legalAction.payload ?? {},
  };
}

export function resolveHqArchivesShuffleDraw(
  host: CorpZoneChoiceHandlerHost,
  agendaId: CardInstanceId,
): CorpZoneChoiceHandlerResult {
  const sourceDefinition = host.cards.definitionFor(agendaId);
  const previousHq = host.state.corp.hq.slice();
  const previousArchives = host.state.corp.archives.slice();
  const merge = [...host.state.corp.rd, ...previousHq, ...previousArchives];
  host.state.corp.hq = [];
  host.state.corp.archives = [];
  host.state.corp.rd = host.zones.shuffleCorpRnd(
    merge,
    `scored_agenda.shuffle.hq_archives_into_rd.${host.state.stateVersion + 1}`,
  );
  refreshCorpRndZones(host, { faceup: false, rezzed: false });
  const drawAmount = host.cards.scoredAgendaDrawCount(agendaId);
  const beforeDraw = host.state.corp.hq.length;
  host.draw.drawCorpCards(drawAmount);
  const drawnCardsCount =
    host.state.pendingCorpDraw?.baseDrawCount ??
    host.state.corp.hq.length - beforeDraw;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    cardId: agendaId,
    cardDefinitionId: sourceDefinition.id,
    sourceDefinitionId: sourceDefinition.id,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "hq_archives_shuffle_into_rd",
    hiddenZoneMutationKind: "shuffle",
    hiddenZoneAffectedCardCount:
      previousHq.length + previousArchives.length + drawnCardsCount,
    hiddenZoneContentsChanged:
      previousHq.length + previousArchives.length + drawnCardsCount > 0,
    hiddenZoneOrderChanged: merge.length > 1,
    hiddenZoneChangesHq: previousHq.length + drawnCardsCount > 0,
    hiddenZoneChangesRd:
      previousHq.length + previousArchives.length > 0 || merge.length > 1,
    shuffledCardsCount: previousHq.length + previousArchives.length,
    drawnCardsCount,
  };
  return {
    handled: true,
    stateChanged: true,
    drawCount: drawAmount,
    sourceZoneCounts: {
      hq: previousHq.length,
      archives: previousArchives.length,
    },
    resolvedPayload: host.legalAction.payload ?? {},
  };
}

function resolveCorpHqAgendaRevealChoice(
  host: CorpZoneChoiceHandlerHost,
): CorpZoneChoiceHandlerResult {
  const choice = requireChoice(
    host,
    "Es ist keine HQ-Agenda-Reveal-Choice offen.",
  );
  const sourceText = choice.source.split(":")[1] ?? "";
  const sourceIds = sourceText.split(",").filter(Boolean) as CardInstanceId[];
  if (
    sourceIds.length === 0 ||
    sourceIds.some(
      (sourceId) =>
        !host.zones.rezzedCorpRootCardIds().includes(sourceId) ||
        !host.cards.hasLifecycleEffect(sourceId, "show_hq_agendas_for_credits"),
    )
  )
    throw new Error("Die HQ-Agenda-Reveal-Quelle ist nicht mehr aktiv.");
  const selectedIds = selectedChoiceCardIds(host, choice);
  assertSelectedHqAgendas(
    host,
    selectedIds,
    "Die HQ-Agenda-Reveal-Choice darf nur HQ-Agenden zeigen.",
  );
  const sourceDefinition = host.cards.definitionFor(sourceIds[0]!);
  const revealedDefinitions = selectedIds.map((cardId) =>
    host.cards.definitionFor(cardId),
  );
  host.credits.gainCorpCredits(selectedIds.length);
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "corp_hq_agenda_reveal",
    sourceDefinitionId: sourceDefinition.id,
    sourceTitle: sourceDefinition.title,
    ...revealedDefinitionsPayload(revealedDefinitions),
    revealedCount: selectedIds.length,
    gainedCredits: selectedIds.length,
    corpCreditsAfter: host.state.corp.credits,
  };
  return revealChoiceResult(
    host,
    selectedIds,
    revealedDefinitions,
    selectedIds.length,
  );
}

function resolveShowHqAgendasForCreditsChoice(
  host: CorpZoneChoiceHandlerHost,
): CorpZoneChoiceHandlerResult {
  const choice = requireChoice(
    host,
    "Es ist keine HQ-Agenda-Show-Choice offen.",
  );
  const [
    ,
    sourceCardId = "",
    sourceDefinitionId = "",
    creditPerAgendaRaw = "",
  ] = choice.source.split(":");
  const creditPerAgenda = Number(creditPerAgendaRaw);
  const continuation = choice.continuation;
  const expectedCreditPerAgenda = sourceCardId
    ? host.cards.lifecycleCreditPerRevealedAgenda(
        sourceCardId as CardInstanceId,
      )
    : undefined;
  if (
    choice.source.split(":").length !== 5 ||
    !sourceCardId ||
    !host.zones
      .rezzedCorpRootCardIds()
      .includes(sourceCardId as CardInstanceId) ||
    host.cards.definitionFor(sourceCardId as CardInstanceId).id !==
      sourceDefinitionId ||
    continuation?.family !== "corp_hq_agenda_reveal_credits" ||
    continuation.sourceCardInstanceId !== sourceCardId ||
    continuation.sourceCardDefinitionId !== sourceDefinitionId ||
    continuation.createdAtStateVersion !== choice.stateVersion ||
    continuation.creditPerRevealedAgenda !== creditPerAgenda ||
    typeof expectedCreditPerAgenda !== "number" ||
    !Number.isSafeInteger(expectedCreditPerAgenda) ||
    expectedCreditPerAgenda <= 0 ||
    creditPerAgenda !== expectedCreditPerAgenda
  )
    throw new Error("Die HQ-Agenda-Reveal-Quelle ist nicht mehr aktiv.");
  const selectedIds = selectedChoiceCardIds(host, choice);
  assertSelectedHqAgendas(
    host,
    selectedIds,
    "Die HQ-Agenda-Reveal-Choice darf nur HQ-Agenden zeigen.",
  );
  const sourceDefinition = host.cards.definitionFor(
    sourceCardId as CardInstanceId,
  );
  const revealedDefinitions = selectedIds.map((cardId) =>
    host.cards.definitionFor(cardId),
  );
  const gainedCredits = selectedIds.length * creditPerAgenda;
  host.credits.gainCorpCredits(gainedCredits);
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "corp_hq_agenda_reveal",
    sourceDefinitionId: sourceDefinition.id,
    sourceTitle: sourceDefinition.title,
    ...revealedDefinitionsPayload(revealedDefinitions),
    revealedCount: selectedIds.length,
    shownCount: selectedIds.length,
    gainedCredits,
    corpCreditsAfter: host.state.corp.credits,
  };
  return revealChoiceResult(
    host,
    selectedIds,
    revealedDefinitions,
    gainedCredits,
  );
}

function resolveScoredAgendaHqShuffleCreditsChoice(
  host: CorpZoneChoiceHandlerHost,
): CorpZoneChoiceHandlerResult {
  const choice = requireChoice(
    host,
    "Es ist keine Scored-Agenda-HQ-Choice offen.",
  );
  const [, sourceCardId = "", creditPerAgendaPointRaw = ""] =
    choice.source.split(":");
  const creditPerAgendaPoint = Number(creditPerAgendaPointRaw);
  const continuation = choice.continuation;
  const expectedCreditPerAgendaPoint = sourceCardId
    ? host.cards.scoredAgendaCreditPerAgendaPoint(
        sourceCardId as CardInstanceId,
      )
    : undefined;
  if (
    choice.source.split(":").length !== 4 ||
    !sourceCardId ||
    !host.state.corp.scoreArea.includes(sourceCardId as CardInstanceId) ||
    host.cards.scoredAgendaKind(sourceCardId as CardInstanceId) !==
      "shuffle_selected_hq_agendas_into_rd_gain_credits" ||
    continuation?.family !== "corp_scored_agenda_hq_shuffle" ||
    continuation.agendaInstanceId !== sourceCardId ||
    continuation.createdAtStateVersion !== choice.stateVersion ||
    continuation.creditPerAgendaPoint !== creditPerAgendaPoint ||
    typeof expectedCreditPerAgendaPoint !== "number" ||
    !Number.isSafeInteger(expectedCreditPerAgendaPoint) ||
    expectedCreditPerAgendaPoint <= 0 ||
    creditPerAgendaPoint !== expectedCreditPerAgendaPoint
  )
    throw new Error("Die Scored-Agenda-HQ-Choice ist nicht mehr aktiv.");
  const selectedIds = selectedChoiceCardIds(host, choice);
  assertSelectedHqAgendas(
    host,
    selectedIds,
    "Diese Scored Agenda darf nur HQ-Agenden zeigen.",
  );
  const selectedSet = new Set(selectedIds);
  const sourceDefinition = host.cards.definitionFor(
    sourceCardId as CardInstanceId,
  );
  const revealedDefinitions = selectedIds.map((cardId) =>
    host.cards.definitionFor(cardId),
  );
  const combinedAgendaPoints = revealedDefinitions.reduce(
    (sum, definition) =>
      sum + Math.max(0, Math.floor(definition.agendaPoints ?? 0)),
    0,
  );
  const gainedCredits = combinedAgendaPoints * creditPerAgendaPoint;
  if (gainedCredits > 0) host.credits.gainCorpCredits(gainedCredits);
  host.state.corp.hq = host.state.corp.hq.filter(
    (cardId) => !selectedSet.has(cardId),
  );
  const randomPurpose = `scored_agenda.hq_agenda_shuffle_credits.hq_agendas_into_rd.${sourceCardId}.${host.state.stateVersion + 1}`;
  host.state.corp.rd = host.zones.shuffleCorpRnd(
    [...host.state.corp.rd, ...selectedIds],
    randomPurpose,
  );
  refreshCorpRndZones(host);
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    agendaAbility: "scored_agenda_hq_agenda_shuffle_credits",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "scored_agenda_hq_agenda_shuffle_credits",
    hiddenZoneMutationKind: "shuffle",
    hiddenZoneAffectedCardCount: selectedIds.length,
    hiddenZoneContentsChanged: selectedIds.length > 0,
    hiddenZoneOrderChanged: selectedIds.length > 0,
    hiddenZoneChangesHq: selectedIds.length > 0,
    hiddenZoneChangesRd: selectedIds.length > 0,
    sourceDefinitionId: sourceDefinition.id,
    sourceTitle: sourceDefinition.title,
    ...revealedDefinitionsPayload(revealedDefinitions),
    shownCardDefinitionIds: revealedDefinitions
      .map((definition) => definition.id)
      .join(","),
    shownCount: selectedIds.length,
    shuffledIntoRndCount: selectedIds.length,
    combinedAgendaPoints,
    gainedCredits,
    corpCreditsAfter: host.state.corp.credits,
    randomDrawRecordPurpose: randomPurpose,
    randomCounterAfter: host.state.randomCounter,
  };
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    selectedCardIds: selectedIds,
    shownCardDefinitionIds: revealedDefinitions.map(
      (definition) => definition.id,
    ),
    shownCount: selectedIds.length,
    shuffledIntoRndCount: selectedIds.length,
    combinedAgendaPoints,
    gainedCredits,
    resolvedPayload: host.legalAction.payload ?? {},
  };
}

function requireChoice(
  host: CorpZoneChoiceHandlerHost,
  message: string,
): ChoiceRequest {
  const choice = host.state.pendingChoice;
  if (!choice) throw new Error(message);
  return choice;
}

function hqAgendaIds(host: CorpZoneChoiceHandlerHost): CardInstanceId[] {
  return host.state.corp.hq
    .filter((cardId) => host.cards.definitionFor(cardId).type === "agenda")
    .sort();
}

function agendaChoiceOptions(
  host: CorpZoneChoiceHandlerHost,
  agendaIds: CardInstanceId[],
): ChoiceRequest["options"] {
  return agendaIds.map((cardId) => {
    const definition = host.cards.definitionFor(cardId);
    return {
      id: `card_${cardId}`,
      label: definition.title,
      publicLabel: "HQ-Agenda",
      value: cardId,
    };
  });
}

function assertSelectedHqAgendas(
  host: CorpZoneChoiceHandlerHost,
  selectedIds: CardInstanceId[],
  message: string,
): void {
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    selectedIds.some(
      (cardId) =>
        !host.state.corp.hq.includes(cardId) ||
        host.cards.definitionFor(cardId).type !== "agenda",
    )
  )
    throw new Error(message);
}

function revealedDefinitionsPayload(
  definitions: CardDefinition[],
): HiddenZonePayload {
  return {
    publicRevealKind: "reveal",
    publicRevealDefinitionIds: definitions
      .map((definition) => definition.id)
      .join(","),
    publicRevealTitles: definitions
      .map((definition) => definition.title)
      .join("||"),
    revealedAgendaDefinitionIds: definitions
      .map((definition) => definition.id)
      .join(","),
  };
}

function revealChoiceResult(
  host: CorpZoneChoiceHandlerHost,
  selectedIds: CardInstanceId[],
  revealedDefinitions: CardDefinition[],
  gainedCredits: number,
): CorpZoneChoiceHandlerResult {
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    selectedCardIds: selectedIds,
    shownCardDefinitionIds: revealedDefinitions.map(
      (definition) => definition.id,
    ),
    shownCount: selectedIds.length,
    gainedCredits,
    resolvedPayload: host.legalAction.payload ?? {},
  };
}

function refreshCorpRndZones(
  host: CorpZoneChoiceHandlerHost,
  options: { faceup?: boolean; rezzed?: boolean } = {},
): void {
  for (const cardId of host.state.corp.rd) {
    host.state.cardInstances[cardId] = {
      ...host.cards.mustInstance(cardId),
      ...(options.faceup === undefined ? {} : { faceup: options.faceup }),
      ...(options.rezzed === undefined ? {} : { rezzed: options.rezzed }),
      zone: { side: "corp", zone: "rd" },
    };
  }
}

function selectedChoiceCardIds(
  host: CorpZoneChoiceHandlerHost,
  choice: ChoiceRequest,
): CardInstanceId[] {
  if (!host.playerAction) throw new Error("Diese Choice hat keine Auswahl.");
  return selectedChoiceIds(host.playerAction.selectedChoices).map(
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
