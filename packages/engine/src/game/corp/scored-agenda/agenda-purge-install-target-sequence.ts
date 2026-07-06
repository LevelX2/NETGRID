import type {
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import { selectedChoiceIds } from "../../choices/choice-validation";
import { hiddenZoneChoicePayload } from "../../choices/hidden-zone-choice";
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
 * @contract Security Purge owns the scored-agenda reveal, target-choice and
 * install/trash sequence for the top three R&D cards.
 * @authority Resolver callbacks revalidate score area, revealed order and
 * selected target servers before any R&D, server or Archives mutation.
 * @visibility Revealed definitions, target labels and counts may be public;
 * unrevealed R&D identity and private choice metadata must not leak.
 */

type SequencePayload = Record<string, string | number | boolean>;
const SECURITY_PURGE_INSTALL_TARGET_CHOICE_SOURCE =
  "card_implementation.agenda_purge_install_targets";

export type AgendaPurgeStep =
  | "reveal_top_rd"
  | "choose_install_targets"
  | "install_and_rez_ice"
  | "trash_non_ice"
  | "complete";

const SECURITY_PURGE_STEPS = {
  revealTopRd: "reveal_top_rd",
  chooseInstallTargets: "choose_install_targets",
  installAndRezIce: "install_and_rez_ice",
  trashNonIce: "trash_non_ice",
  complete: "complete",
} satisfies Record<string, AgendaPurgeStep>;

export function isAgendaPurgeInstallTargetChoiceSource(
  source: string,
): boolean {
  return source.startsWith(`${SECURITY_PURGE_INSTALL_TARGET_CHOICE_SOURCE}:`);
}

export function resolveAgendaPurgeInstallTargets(
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
  const revealedIceIds = agendaPurgeIceIds(host, revealedIds);
  const pendingTrashIds = revealedIds.filter(
    (cardId) => !revealedIceIds.includes(cardId),
  );
  const basePayload = agendaPurgeBasePayload(host, agendaId, revealedIds);
  if (revealedIceIds.length > 0) {
    host.state.pendingChoice = {
      choiceId: `choice_agenda_purge_install_targets_${host.state.stateVersion + 1}`,
      side: "corp",
      source: `${SECURITY_PURGE_INSTALL_TARGET_CHOICE_SOURCE}:${agendaId}:${revealedIds.join(",")}:${host.state.stateVersion + 1}`,
      prompt: "Security Purge: Zielserver fuer aufgedeckte ICE waehlen.",
      kind: "select_option",
      options: agendaPurgeInstallTargetOptions(
        host,
        revealedIds,
        revealedIceIds,
      ),
      minSelections: revealedIceIds.length,
      maxSelections: revealedIceIds.length,
      stateVersion: host.state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    applySequencePayloadPatch(host.legalAction, {
      ...basePayload,
      ...hiddenZoneChoicePayload("agenda_purge_rd_top3_target_choice"),
      ...corpSequenceContextPayload({
        step: SECURITY_PURGE_STEPS.chooseInstallTargets,
        revealedIceCount: revealedIceIds.length,
        pendingTrashCount: pendingTrashIds.length,
        installedIceCount: 0,
        trashedCount: 0,
        agendaPurgeTargetChoiceOpened: true,
        agendaPurgeTargetChoiceCount: revealedIceIds.length,
      }),
    });
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
  return applySequenceResolution(host.legalAction, {
    result: {
      handled: true,
      installedCardIds: [],
      trashedCardIds: trashedIds,
      shownCardDefinitionIds: revealedIds.map(
        (id) => host.cards.definitionFor(id).id,
      ),
      shownCount: revealedIds.length,
    },
    stateChanged: true,
    payloadPatch: {
      ...basePayload,
      ...hiddenZoneChoicePayload("agenda_purge_rd_top3"),
      ...corpSequenceContextPayload({
        step: SECURITY_PURGE_STEPS.trashNonIce,
        revealedIceCount: 0,
        pendingTrashCount: 0,
        installedIceCount: 0,
        trashedCount: trashedIds.length,
        agendaPurgeTargetChoiceOpened: false,
        trashedDefinitionIds: trashedIds
          .map((id) => host.cards.definitionFor(id).id)
          .join(","),
      }),
    },
  });
}

export function resolveAgendaPurgeInstallTargetChoice(
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
  validateAgendaPurgeRevealedCards(host, revealedIds);
  const revealedIceIds = agendaPurgeIceIds(host, revealedIds);
  if (revealedIceIds.length === 0)
    throw new Error("Security Purge hat keine ICE-Zielwahl offen.");
  const targetByCardId = selectedAgendaPurgeTargets(
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
  return applySequenceResolution(host.legalAction, {
    result: {
      handled: true,
      deletePendingChoice: true,
      installedCardIds: installedIce.map((entry) => entry.cardId),
      rezzedCardIds: installedIce.map((entry) => entry.cardId),
      trashedCardIds: trashedIds,
      shownCardDefinitionIds: revealedIds.map(
        (id) => host.cards.definitionFor(id).id,
      ),
      shownCount: revealedIds.length,
    },
    stateChanged: true,
    payloadPatch: {
      ...agendaPurgeBasePayload(host, agendaId, revealedIds),
      ...hiddenZoneChoicePayload("agenda_purge_install_targets"),
      ...corpSequenceContextPayload({
        step: SECURITY_PURGE_STEPS.installAndRezIce,
        revealedIceCount: installedIce.length,
        pendingTrashCount: 0,
        installedIceCount: installedIce.length,
        trashedCount: trashedIds.length,
        agendaPurgeTargetChoiceOpened: false,
        agendaPurgeTargetChoiceResolved: true,
        installedIceDefinitionIds: installedIce
          .map((entry) => host.cards.definitionFor(entry.cardId).id)
          .join(","),
        installedIceServerLabels: installedIce
          .map((entry) => entry.server.label)
          .join(","),
        trashedDefinitionIds: trashedIds
          .map((id) => host.cards.definitionFor(id).id)
          .join(","),
      }),
    },
  });
}

function agendaPurgeBasePayload(
  host: CorpInstallRezSequenceHandlerHost,
  agendaId: CardInstanceId,
  revealedIds: readonly CardInstanceId[],
): SequencePayload {
  return {
    ...hiddenZoneChoicePayload("agenda_purge"),
    ...corpSequenceContextPayload({
      step: SECURITY_PURGE_STEPS.revealTopRd,
      agendaAbility: "agenda_purge",
      sourceDefinitionId: host.cards.definitionFor(agendaId).id,
      publicRevealKind: "reveal",
      revealedCount: revealedIds.length,
      agendaPurgeInstallContract: "corp_server_choice_per_ice",
      agendaPurgeWaivesPrintedRezCosts: true,
      publicRevealDefinitionIds: revealedIds
        .map((id) => host.cards.definitionFor(id).id)
        .join(","),
    }),
  };
}

function agendaPurgeIceIds(
  host: CorpInstallRezSequenceHandlerHost,
  revealedIds: readonly CardInstanceId[],
): CardInstanceId[] {
  return revealedIds.filter((cardId) => {
    const definition = host.cards.definitionFor(cardId);
    return definition.type === "ice";
  });
}

function agendaPurgeInstallTargetOptions(
  host: CorpInstallRezSequenceHandlerHost,
  revealedIds: readonly CardInstanceId[],
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
  const revealedCardOptions = revealedIds.map((cardId) => ({
    id: `agenda_purge_revealed_${cardId}`,
    label: host.cards.definitionFor(cardId).title,
    publicLabel: "Security-Purge-R&D-Karte",
    value: cardId,
    selectable: false,
  }));
  const targetOptions = iceIds.flatMap((cardId) => {
    const title = host.cards.definitionFor(cardId).title;
    return serverTargets.map((target) => ({
      id: `agenda_purge_${cardId}_${target.serverId}`,
      label: `${title}: ${agendaPurgeTargetLabel(target)}`,
      publicLabel: "Security-Purge-Zielserver",
      value: `${cardId}|${target.serverId}`,
    }));
  });
  return [...revealedCardOptions, ...targetOptions];
}

function agendaPurgeTargetLabel(target: {
  serverId: ServerId;
  label: string;
}): string {
  return target.serverId === "new_remote"
    ? "in neues Remote installieren"
    : `vor ${target.label} installieren`;
}

function validateAgendaPurgeRevealedCards(
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

function selectedAgendaPurgeTargets(
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
    if (typeof option?.value !== "string" || option.selectable === false)
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
