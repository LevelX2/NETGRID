import type {
  CardDefinition,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  HqInstallRezSequenceState,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import {
  cardImplementationPrimitivePayload,
  type HqToNewRemoteInstallRezSequence,
} from "../../../ability-engine/card-implementation-primitives";
import {
  hiddenCardChoiceOption,
  hiddenZoneChoicePayload,
  selectedHiddenCardChoiceIds,
} from "../../choices/hidden-zone-choice";
import type {
  CorpInstallRezSequenceHandlerHost,
  CorpInstallRezSequenceHandlerResult,
} from "./scored-agenda-sequence-host";
import {
  applySequencePayloadPatch,
  applySequenceResolution,
  corpSequenceContextPayload,
} from "./scored-agenda-sequence-types";

/**
 * @contract Data Fort Reclamation owns the hidden HQ install/rez sequence.
 * @authority Legality still comes from scored-agenda LegalActions and every
 * choice resolve revalidates source, score area, selected HQ cards and costs.
 * @visibility HQ choices stay corp-private; public payloads expose only
 * counts, public definition IDs, server IDs and credit totals.
 */

const HQ_TO_NEW_REMOTE_INSTALL_REZ_SOURCE =
  "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez";
const HQ_TO_NEW_REMOTE_INSTALL_REZ_REZ_SOURCE =
  "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez";

type PrevalidatedHqToNewRemoteInstall = {
  cardId: CardInstanceId;
  definition: CardDefinition;
  destination: "ice" | "root";
};

export type HqToNewRemoteInstallRezStep =
  | "select_hq_cards"
  | "install_next_card"
  | "required_rez_on_install"
  | "optional_rez_card"
  | "return_unused_credits"
  | "complete";

const HQ_INSTALL_REZ_STEPS = {
  selectHqCards: "select_hq_cards",
  installNextCard: "install_next_card",
  optionalRezCard: "optional_rez_card",
  returnUnusedCredits: "return_unused_credits",
} satisfies Record<string, HqToNewRemoteInstallRezStep>;

export function isHqToNewRemoteInstallRezChoiceSource(source: string): boolean {
  return (
    source.startsWith(`${HQ_TO_NEW_REMOTE_INSTALL_REZ_SOURCE}:`) ||
    source.startsWith("card_implementation.hq_to_new_remote_install_rez:")
  );
}

export function isHqToNewRemoteInstallRezRezChoiceSource(
  source: string,
): boolean {
  return (
    source.startsWith(`${HQ_TO_NEW_REMOTE_INSTALL_REZ_REZ_SOURCE}:`) ||
    source.startsWith("card_implementation.hq_to_new_remote_rez")
  );
}

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

export function startHqToNewRemoteInstallRezChoice(
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
      return hiddenCardChoiceOption({ cardId, label: definition.title });
    });
  if (options.length === 0) {
    return applySequenceResolution(host.legalAction, {
      result: { handled: true },
      payloadPatch: {
        ...primitivePayload,
        ...corpSequenceContextPayload({
          step: HQ_INSTALL_REZ_STEPS.selectHqCards,
          abilityId: "hq_to_new_remote_install_rez",
          sourceAgendaId: agendaId,
          hqToNewRemoteInstallRezChoiceOpened: false,
          hqToNewRemoteInstallRezCandidateCount: 0,
        }),
      },
    });
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
  return applySequenceResolution(host.legalAction, {
    result: { handled: true },
    stateChanged: true,
    payloadPatch: {
      ...primitivePayload,
      ...corpSequenceContextPayload({
        step: HQ_INSTALL_REZ_STEPS.selectHqCards,
        abilityId: "hq_to_new_remote_install_rez",
        sourceAgendaId: agendaId,
        cardImplementationSourceZone: sequence.sourceZone,
        cardImplementationTargetServer: sequence.targetServer,
        cardImplementationAllowedCards: sequence.allowedCards,
        cardImplementationMaxCards: sequence.maxCards,
        cardImplementationTemporaryCreditBudget:
          sequence.temporaryCredits.amount,
        hqToNewRemoteInstallRezChoiceOpened: true,
        hqToNewRemoteInstallRezCandidateCount: options.length,
        hqToNewRemoteInstallRezMaxSelections: Math.min(
          sequence.maxCards,
          options.length,
        ),
      }),
      ...hiddenZoneChoicePayload("hq_to_new_remote_install_rez_hq_choice"),
    },
  });
}

/**
 * @mvpBoundary This path installs selected HQ cards first and opens one
 * follow-up rez choice. Region replacement and required root rez-on-install
 * now run inside the ordered install/rez sequence. A fully interactive
 * optional rez choice after each individual non-required card remains deferred.
 */
export function resolveHqToNewRemoteInstallRezChoice(
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
    const resolvedPayload = applySequencePayloadPatch(host.legalAction, {
      ...primitivePayload,
      ...hiddenZoneChoicePayload("hq_to_new_remote_install_sequence"),
      ...corpSequenceContextPayload({
        step: HQ_INSTALL_REZ_STEPS.returnUnusedCredits,
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
        hqToNewRemoteInstallRezRezChoiceOpened: false,
        hqToNewRemoteInstallRezRezCandidateCount: 0,
      }),
    });
    return {
      handled: true,
      stateChanged: true,
      deletePendingChoice: true,
      selectedCardIds: [],
      installedCardIds: [],
      temporaryCreditsGranted: temporaryCreditAmount,
      temporaryCreditsReturned: temporaryCreditAmount,
      resolvedPayload,
    };
  }

  const server = host.servers.createRemote();
  host.state.hqInstallRezSequence = {
    sourceAgendaId: agendaId as CardInstanceId,
    sourceDefinitionId: host.cards.definitionFor(agendaId as CardInstanceId).id,
    serverId: server.id,
    selectedCardIds: selectedCards.map((card) => card.cardId),
    nextCardIndex: 0,
    temporaryCreditsProvided: temporaryCreditAmount,
    temporaryCreditsRemaining: temporaryCreditAmount,
  };
  delete host.state.pendingChoice;
  const result = advanceHqInstallRezSequence(host, primitivePayload);
  return {
    ...result,
    createdServerId: server.id,
    selectedCardIds: selectedIds,
    temporaryCreditsGranted: temporaryCreditAmount,
  };
}

function advanceHqInstallRezSequence(
  host: CorpInstallRezSequenceHandlerHost,
  primitivePayload = hqInstallRezPrimitivePayload(host),
): CorpInstallRezSequenceHandlerResult {
  const sequenceState = requireHqInstallRezSequence(host);
  const server = host.servers.mustServer(sequenceState.serverId);
  const installedIds: CardInstanceId[] = [];
  const immediatelyRezzedIds: CardInstanceId[] = [];
  const corpCreditsBefore = host.state.corp.credits;

  while (sequenceState.nextCardIndex < sequenceState.selectedCardIds.length) {
    const cardId = sequenceState.selectedCardIds[sequenceState.nextCardIndex]!;
    const { definition, destination } = revalidateNextHqInstall(
      host,
      cardId,
      server,
    );
    host.zones.removeFromAllZones(cardId);
    const rootRezOnInstall =
      destination === "root" &&
      requiresOrderedRootInstallRezSequence(host, definition);
    if (destination === "ice") {
      server.ice.push(cardId);
      host.state.cardInstances[cardId] = {
        ...host.cards.mustInstance(cardId),
        faceup: false,
        rezzed: false,
        zone: { side: "corp", zone: "serverIce", serverId: server.id },
      };
    } else {
      server.root.push(cardId);
      if (rootRezOnInstall) {
        const payment = spendHqToNewRemoteInstallRezRezCost(
          host,
          cardId,
          sequenceState.temporaryCreditsRemaining,
        );
        sequenceState.temporaryCreditsRemaining =
          payment.temporaryCreditsRemaining;
      }
      host.state.cardInstances[cardId] = {
        ...host.cards.mustInstance(cardId),
        faceup: rootRezOnInstall,
        rezzed: rootRezOnInstall,
        zone: { side: "corp", zone: "serverRoot", serverId: server.id },
      };
      if (rootRezOnInstall) {
        immediatelyRezzedIds.push(cardId);
        host.callbacks.resolveCorpRootRez(cardId);
        if (host.cards.isRegionUpgrade(definition))
          host.servers.trashOlderRegionUpgradesInServer(
            server,
            cardId,
            host.legalAction,
          );
      }
    }
    installedIds.push(cardId);
    sequenceState.nextCardIndex += 1;

    if (isHqToNewRemoteInstallRezRezCandidate(host, cardId, server.id)) {
      host.state.pendingChoice = hqInstallRezChoice(
        host,
        sequenceState,
        cardId,
      );
      const resolvedPayload = applySequencePayloadPatch(host.legalAction, {
        ...primitivePayload,
        ...hiddenZoneChoicePayload("hq_to_new_remote_install_sequence"),
        ...hqInstallRezSequencePayload(
          host,
          sequenceState,
          HQ_INSTALL_REZ_STEPS.installNextCard,
          {
            installedCount: installedIds.length,
            immediateRezzedCount: immediatelyRezzedIds.length,
            hqToNewRemoteInstallRezRezChoiceOpened: true,
            hqToNewRemoteInstallRezRezCandidateCount: 1,
            corpCreditsSpent: corpCreditsBefore - host.state.corp.credits,
          },
        ),
      });
      return {
        handled: true,
        stateChanged: true,
        installedCardIds: installedIds,
        rezzedCardIds: immediatelyRezzedIds,
        resolvedPayload,
      };
    }
  }

  return completeHqInstallRezSequence(
    host,
    sequenceState,
    primitivePayload,
    installedIds,
    immediatelyRezzedIds,
    corpCreditsBefore - host.state.corp.credits,
  );
}

function revalidateNextHqInstall(
  host: CorpInstallRezSequenceHandlerHost,
  cardId: CardInstanceId,
  server: CorpServer,
): PrevalidatedHqToNewRemoteInstall {
  if (!host.state.corp.hq.includes(cardId))
    throw new Error("Eine gewaehlte Data-Fort-Karte liegt nicht mehr in HQ.");
  const definition = host.cards.definitionFor(cardId);
  if (!host.cards.isCorpInstallableCardType(definition))
    throw new Error("Eine gewaehlte Data-Fort-Karte ist nicht installierbar.");
  if (definition.type === "ice")
    return { cardId, definition, destination: "ice" };
  if (!host.cards.canInstallCorpRootCardInServer(definition, server))
    throw new Error(
      "Diese Root-Karte kann nicht in das Data Fort installiert werden.",
    );
  return { cardId, definition, destination: "root" };
}

function hqInstallRezChoice(
  host: CorpInstallRezSequenceHandlerHost,
  sequenceState: HqInstallRezSequenceState,
  cardId: CardInstanceId,
): ChoiceRequest {
  const sequenceLength = sequenceState.selectedCardIds.length;
  const sequencePosition = sequenceState.nextCardIndex;
  const definition = host.cards.definitionFor(cardId);
  return {
    choiceId: `choice_card_implementation_hq_to_new_remote_install_rez_rez_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `${HQ_TO_NEW_REMOTE_INSTALL_REZ_REZ_SOURCE}:${sequenceState.sourceAgendaId}:${sequenceState.serverId}:${cardId}:${sequencePosition}:${host.state.stateVersion + 1}`,
    prompt: `Data Fort Reclamation: Karte ${sequencePosition} von ${sequenceLength} rezzen (${sequenceState.temporaryCreditsRemaining} temporäre Credits verfügbar).`,
    kind: "select_cards",
    options: [hiddenCardChoiceOption({ cardId, label: definition.title })],
    minSelections: 0,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function requireHqInstallRezSequence(
  host: CorpInstallRezSequenceHandlerHost,
): HqInstallRezSequenceState {
  const sequenceState = host.state.hqInstallRezSequence;
  if (!sequenceState)
    throw new Error("Die Data-Fort-Reclamation-Sequenz ist nicht aktiv.");
  if (
    !host.state.corp.scoreArea.includes(sequenceState.sourceAgendaId) ||
    host.cards.scoredAgendaKind(sequenceState.sourceAgendaId) !==
      "score_install_hq_cards_into_new_remote_then_rez"
  )
    throw new Error(
      "Die Data-Fort-Reclamation-Agenda ist nicht mehr gescored.",
    );
  if (
    sequenceState.selectedCardIds.length === 0 ||
    sequenceState.selectedCardIds.length > 4 ||
    new Set(sequenceState.selectedCardIds).size !==
      sequenceState.selectedCardIds.length ||
    !Number.isInteger(sequenceState.nextCardIndex) ||
    sequenceState.nextCardIndex < 0 ||
    sequenceState.nextCardIndex > sequenceState.selectedCardIds.length ||
    !Number.isInteger(sequenceState.temporaryCreditsProvided) ||
    sequenceState.temporaryCreditsProvided < 0 ||
    !Number.isInteger(sequenceState.temporaryCreditsRemaining) ||
    sequenceState.temporaryCreditsRemaining < 0 ||
    sequenceState.temporaryCreditsRemaining >
      sequenceState.temporaryCreditsProvided
  )
    throw new Error("Der Data-Fort-Reclamation-Sequenzzustand ist ungueltig.");
  return sequenceState;
}

function hqInstallRezPrimitivePayload(
  host: CorpInstallRezSequenceHandlerHost,
): ReturnType<typeof cardImplementationPrimitivePayload> {
  const sequenceState = requireHqInstallRezSequence(host);
  const sequence = requireHqToNewRemoteInstallRezSequence(
    host,
    sequenceState.sourceAgendaId,
  );
  return cardImplementationPrimitivePayload({
    sourceCardId: sequenceState.sourceAgendaId,
    sourceDefinitionId: sequenceState.sourceDefinitionId,
    primitiveKind: sequence.kind,
    effectKind: "install_rez_sequence",
    abilityKey: sequence.abilityKey,
  });
}

function hqInstallRezSequencePayload(
  host: CorpInstallRezSequenceHandlerHost,
  sequenceState: HqInstallRezSequenceState,
  step: HqToNewRemoteInstallRezStep,
  extra: Record<string, string | number | boolean> = {},
): ReturnType<typeof corpSequenceContextPayload> {
  const installedIds = sequenceState.selectedCardIds.slice(
    0,
    sequenceState.nextCardIndex,
  );
  const installedIceCount = installedIds.filter(
    (cardId) => host.cards.definitionFor(cardId).type === "ice",
  ).length;
  const installedRootCount = installedIds.length - installedIceCount;
  const temporaryCreditsSpent =
    sequenceState.temporaryCreditsProvided -
    sequenceState.temporaryCreditsRemaining;
  return corpSequenceContextPayload({
    step,
    sourceAgendaId: sequenceState.sourceAgendaId,
    selectedCount: sequenceState.selectedCardIds.length,
    installedCount: installedIds.length,
    installedIceCount,
    installedRootCount,
    createdServerId: sequenceState.serverId,
    cardImplementationSequenceCreatedServerId: sequenceState.serverId,
    cardImplementationTemporaryCreditBudget:
      sequenceState.temporaryCreditsProvided,
    temporaryCreditsProvided: sequenceState.temporaryCreditsProvided,
    temporaryCreditsSpent,
    temporaryCreditsRemaining: sequenceState.temporaryCreditsRemaining,
    corpCreditsAfter: host.state.corp.credits,
    ...extra,
  });
}

function completeHqInstallRezSequence(
  host: CorpInstallRezSequenceHandlerHost,
  sequenceState: HqInstallRezSequenceState,
  primitivePayload: ReturnType<typeof cardImplementationPrimitivePayload>,
  installedIds: CardInstanceId[],
  rezzedCardIds: CardInstanceId[],
  corpCreditsSpent: number,
): CorpInstallRezSequenceHandlerResult {
  const temporaryCreditsReturned = sequenceState.temporaryCreditsRemaining;
  const resolvedPayload = applySequencePayloadPatch(host.legalAction, {
    ...primitivePayload,
    ...hiddenZoneChoicePayload("hq_to_new_remote_install_sequence"),
    ...hqInstallRezSequencePayload(
      host,
      sequenceState,
      HQ_INSTALL_REZ_STEPS.returnUnusedCredits,
      {
        temporaryCreditsReturned,
        corpCreditsSpent,
        immediateRezzedCount: rezzedCardIds.length,
        hqToNewRemoteInstallRezRezChoiceOpened: false,
        hqToNewRemoteInstallRezRezCandidateCount: 0,
      },
    ),
  });
  delete host.state.pendingChoice;
  delete host.state.hqInstallRezSequence;
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    installedCardIds: installedIds,
    rezzedCardIds,
    temporaryCreditsReturned,
    resolvedPayload,
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

export function resolveHqToNewRemoteInstallRezRezChoice(
  host: CorpInstallRezSequenceHandlerHost,
): CorpInstallRezSequenceHandlerResult {
  const choice = requireChoice(
    host,
    "HQ-to-new-remote-Install-/Rez-Choice ist nicht offen.",
  );
  const sequenceState = requireHqInstallRezSequence(host);
  const [, agendaId, serverId, cardId, sequencePositionText] =
    choice.source.split(":");
  const expectedCardId =
    sequenceState.selectedCardIds[sequenceState.nextCardIndex - 1];
  const sequencePosition = Math.floor(Number(sequencePositionText));
  if (
    !agendaId ||
    !serverId ||
    !cardId ||
    agendaId !== sequenceState.sourceAgendaId ||
    serverId !== sequenceState.serverId ||
    cardId !== expectedCardId ||
    !Number.isInteger(sequencePosition) ||
    sequencePosition !== sequenceState.nextCardIndex
  )
    throw new Error("Die Data-Fort-Reclamation-Rez-Choice ist ungueltig.");
  host.servers.mustServer(sequenceState.serverId);
  const selectedIds = selectedChoiceCardIds(host, choice);
  if (selectedIds.length > 1)
    throw new Error(
      "Data Fort Reclamation darf nur die aktuelle Karte rezzen.",
    );
  if (selectedIds.length === 1 && selectedIds[0] !== expectedCardId)
    throw new Error(
      "Eine andere Karte kann nicht mit Data Fort Reclamation gerezzt werden.",
    );
  if (
    expectedCardId &&
    !isHqToNewRemoteInstallRezRezCandidate(
      host,
      expectedCardId,
      sequenceState.serverId,
    )
  )
    throw new Error("Die aktuelle Data-Fort-Karte kann nicht gerezzed werden.");

  const primitivePayload = hqInstallRezPrimitivePayload(host);
  const corpCreditsBefore = host.state.corp.credits;
  const rezzedCardIds: CardInstanceId[] = [];
  if (expectedCardId && selectedIds.length === 1) {
    const payment = spendHqToNewRemoteInstallRezRezCost(
      host,
      expectedCardId,
      sequenceState.temporaryCreditsRemaining,
    );
    sequenceState.temporaryCreditsRemaining = payment.temporaryCreditsRemaining;
    const definition = host.cards.definitionFor(expectedCardId);
    const instance = host.cards.mustInstance(expectedCardId);
    host.state.cardInstances[expectedCardId] = {
      ...instance,
      faceup: true,
      rezzed: true,
    };
    if (definition.type !== "ice")
      host.callbacks.resolveCorpRootRez(expectedCardId);
    rezzedCardIds.push(expectedCardId);
  }
  delete host.state.pendingChoice;
  const result = advanceHqInstallRezSequence(host, primitivePayload);
  return {
    ...result,
    rezzedCardIds: [...rezzedCardIds, ...(result.rezzedCardIds ?? [])],
    temporaryCreditsGranted: sequenceState.temporaryCreditsProvided,
    ...(result.resolvedPayload
      ? {
          resolvedPayload: applySequencePayloadPatch(host.legalAction, {
            ...result.resolvedPayload,
            ...hiddenZoneChoicePayload("hq_to_new_remote_rez_sequence"),
            ...hqInstallRezSequencePayload(
              host,
              sequenceState,
              HQ_INSTALL_REZ_STEPS.optionalRezCard,
              {
                rezzedCount: rezzedCardIds.length,
                rezzedIceCount: rezzedCardIds.filter(
                  (rezId) => host.cards.definitionFor(rezId).type === "ice",
                ).length,
                rezzedRootCount: rezzedCardIds.filter(
                  (rezId) => host.cards.definitionFor(rezId).type !== "ice",
                ).length,
                corpCreditsSpent: corpCreditsBefore - host.state.corp.credits,
              },
            ),
          }),
        }
      : {}),
  };
}

function spendHqToNewRemoteInstallRezRezCost(
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

function isHqToNewRemoteInstallRezRezCandidate(
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
  return selectedHiddenCardChoiceIds(
    requirePlayerAction(host).selectedChoices,
    choice,
  );
}
