import type {
  CardDefinition,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
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

export type DataFortReclamationStep =
  | "select_hq_cards"
  | "install_selected_cards"
  | "required_rez_on_install"
  | "optional_rez_batch"
  | "return_unused_credits"
  | "complete";

const DATA_FORT_RECLAMATION_STEPS = {
  selectHqCards: "select_hq_cards",
  installSelectedCards: "install_selected_cards",
  optionalRezBatch: "optional_rez_batch",
  returnUnusedCredits: "return_unused_credits",
} satisfies Record<string, DataFortReclamationStep>;

export function isHqToNewRemoteInstallRezChoiceSource(source: string): boolean {
  return (
    source.startsWith(`${HQ_TO_NEW_REMOTE_INSTALL_REZ_SOURCE}:`) ||
    source.startsWith("v1922.data_fort_reclamation:")
  );
}

export function isHqToNewRemoteInstallRezRezChoiceSource(
  source: string,
): boolean {
  return (
    source.startsWith(`${HQ_TO_NEW_REMOTE_INSTALL_REZ_REZ_SOURCE}:`) ||
    source.startsWith("v1922.data_fort_reclamation_rez")
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
      return hiddenCardChoiceOption({ cardId, label: definition.title });
    });
  if (options.length === 0) {
    return applySequenceResolution(host.legalAction, {
      result: { handled: true },
      payloadPatch: {
        ...primitivePayload,
        ...corpSequenceContextPayload({
          step: DATA_FORT_RECLAMATION_STEPS.selectHqCards,
          v1922CorpAgendaAbility: "data_fort_reclamation",
          sourceAgendaId: agendaId,
          dataFortReclamationChoiceOpened: false,
          dataFortReclamationCandidateCount: 0,
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
        step: DATA_FORT_RECLAMATION_STEPS.selectHqCards,
        v1922CorpAgendaAbility: "data_fort_reclamation",
        sourceAgendaId: agendaId,
        cardImplementationSourceZone: sequence.sourceZone,
        cardImplementationTargetServer: sequence.targetServer,
        cardImplementationAllowedCards: sequence.allowedCards,
        cardImplementationMaxCards: sequence.maxCards,
        cardImplementationTemporaryCreditBudget:
          sequence.temporaryCredits.amount,
        dataFortReclamationChoiceOpened: true,
        dataFortReclamationCandidateCount: options.length,
        dataFortReclamationMaxSelections: Math.min(
          sequence.maxCards,
          options.length,
        ),
      }),
      ...hiddenZoneChoicePayload("v1922_data_fort_reclamation_hq_choice"),
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
      ...hiddenZoneChoicePayload(
        "v1922_data_fort_reclamation_install_sequence",
      ),
      ...corpSequenceContextPayload({
        step: DATA_FORT_RECLAMATION_STEPS.returnUnusedCredits,
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
  const resolvedPayload = applySequencePayloadPatch(host.legalAction, {
    ...primitivePayload,
    ...hiddenZoneChoicePayload("v1922_data_fort_reclamation_install_sequence"),
    ...corpSequenceContextPayload({
      step: DATA_FORT_RECLAMATION_STEPS.installSelectedCards,
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
    }),
  });
  if (rezCandidates.length > 0) {
    host.state.pendingChoice = {
      choiceId: `choice_card_implementation_hq_to_new_remote_install_rez_rez_${host.state.stateVersion + 1}`,
      side: "corp",
      source: `${HQ_TO_NEW_REMOTE_INSTALL_REZ_REZ_SOURCE}:${agendaId}:${server.id}:${temporaryCreditsRemaining}:${host.state.stateVersion + 1}`,
      prompt: "Data Fort Reclamation: installierte Karten rezzen.",
      kind: "select_cards",
      options: rezCandidates.sort().map((cardId) => {
        const definition = host.cards.definitionFor(cardId);
        return hiddenCardChoiceOption({ cardId, label: definition.title });
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
  const resolvedPayload = applySequencePayloadPatch(host.legalAction, {
    ...primitivePayload,
    ...hiddenZoneChoicePayload("v1922_data_fort_reclamation_rez_sequence"),
    ...corpSequenceContextPayload({
      step: DATA_FORT_RECLAMATION_STEPS.optionalRezBatch,
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
    }),
  });
  return {
    handled: true,
    stateChanged: true,
    deletePendingChoice: true,
    rezzedCardIds: selectedIds,
    temporaryCreditsGranted: temporaryCreditAmount,
    temporaryCreditsReturned: temporaryCreditsRemaining,
    resolvedPayload,
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
  return selectedHiddenCardChoiceIds(
    requirePlayerAction(host).selectedChoices,
    choice,
  );
}
