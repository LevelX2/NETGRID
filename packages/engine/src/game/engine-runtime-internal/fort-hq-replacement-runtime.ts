import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import { selectedChoiceCardIds } from "./choice-runtime-delegates";
import {
  canInstallCorpRootCardInServer,
  corpRootAgendaOrNodeCapacityInServer,
} from "./flow-runtime-delegates";
import { cloneState } from "./runtime-bootstrap-support";
import {
  corpRootMainCardIdsInServer,
  definitionFor,
  mustInstance,
  mustServer,
} from "../state/card-server-lookup";
import {
  removeFromAllZones,
  uninstallCorpInstalledCardToHq,
} from "../state/zone-mutation";
import { stateIsAtServerAfterPassingLastIceWindow } from "../run/windows/after-passing-last-ice-window";
import { orderedFortRebuildPublicPayload } from "../run/windows/ordered-fort-rebuild-sequence";
import { applyRunWindowPayloadPatch } from "../run/windows/run-window-sequence-types";

export function replaceFortCardsFromHq(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  selectedHqCardIds: readonly CardInstanceId[] = [],
): { publicPayload: Record<string, string | number | boolean> } {
  const source = mustInstance(state.cardInstances, sourceCardId);
  if (
    source.controller !== "corp" ||
    source.zone.side !== "corp" ||
    source.zone.zone !== "serverRoot"
  )
    throw new Error("Die Quelle muss in einem Remote-Root installiert sein.");
  const server = mustServer(state, source.zone.serverId);
  if (server.kind !== "remote")
    throw new Error("Fort-Ersatz darf nur in einem Remote ausloesen.");
  const targetServerId = server.id as Exclude<
    ServerId,
    "hq" | "rd" | "archives" | "new_remote"
  >;
  if (!stateIsAtServerAfterPassingLastIceWindow(state, server))
    throw new Error(
      "Fort-Ersatz darf nur nach der letzten ICE dieses Forts ausloesen.",
    );
  const removedIce = server.ice.slice();
  const removedRoot = server.root.slice();
  const removedCount = removedIce.length + removedRoot.length;
  const legalCandidates = legalFortReplacementHqCardIds(
    state,
    server,
    removedCount,
  );
  if (legalCandidates.length < removedCount)
    throw new Error("Es gibt nicht genug legale HQ-Ersatzkarten.");
  const hqSelection = selectedHqCardIds.slice();
  if (hqSelection.length === 0 && legalCandidates.length > removedCount) {
    openFortHqReplacementChoice(
      state,
      sourceCardId,
      sourceDefinitionId,
      server,
      removedCount,
      legalCandidates,
    );
    const payload = {
      ...orderedFortRebuildPublicPayload({
        sourceDefinitionId,
        targetServerId,
        removedCardCount: removedCount,
        replacementCardCount: 0,
        installedIceCount: 0,
        installedRootCount: 0,
      }),
      sourceDefinitionId,
      serverId: server.id,
      serverLabel: server.label,
      orderedFortRebuildChoiceOpened: true,
      replacementCount: removedCount,
      hqCandidateCount: legalCandidates.length,
    };
    applyRunWindowPayloadPatch(legalAction, payload);
    return { publicPayload: payload };
  }
  const selected =
    hqSelection.length > 0 ? hqSelection : legalCandidates.slice(0, removedCount);
  if (selected.length !== removedCount)
    throw new Error("Fort-Ersatz braucht exakt gleich viele HQ-Ersatzkarten.");
  if (new Set(selected).size !== selected.length)
    throw new Error("Die Fort-Ersatz-Auswahl enthaelt Duplikate.");
  for (const cardId of selected) {
    if (!state.corp.hq.includes(cardId))
      throw new Error("Eine Fort-Ersatzkarte liegt nicht mehr in HQ.");
    if (!legalCandidates.includes(cardId))
      throw new Error("Eine Fort-Ersatzkarte ist nicht installierbar.");
  }
  const validInstallOrder = validFortReplacementInstallOrder(
    state,
    server,
    selected,
  );
  if (!validInstallOrder)
    throw new Error("Die Fort-Ersatzkarten sind gemeinsam nicht installierbar.");
  for (const cardId of [...removedIce, ...removedRoot]) {
    uninstallCorpInstalledCardToHq(state, cardId);
  }
  server.ice = [];
  server.root = [];
  for (const cardId of validInstallOrder) {
    const definition = definitionFor(state, cardId);
    if (definition.type === "ice") {
      removeFromAllZones(state, cardId);
      server.ice.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: false,
        rezzed: false,
        zone: { side: "corp", zone: "serverIce", serverId: server.id },
      };
    } else if (
      definition.type === "asset" ||
      definition.type === "agenda" ||
      definition.type === "upgrade"
    ) {
      if (!canInstallCorpRootCardInServer(state, definition, server))
        throw new Error("Eine Fort-Root-Ersatzkarte ist nicht legal.");
      removeFromAllZones(state, cardId);
      server.root.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: false,
        rezzed: false,
        zone: { side: "corp", zone: "serverRoot", serverId: server.id },
      };
    } else {
      throw new Error("Diese HQ-Karte kann nicht in das Fort installiert werden.");
    }
  }
  const payload = {
    ...orderedFortRebuildPublicPayload({
      sourceDefinitionId,
      targetServerId,
      removedCardCount: removedCount,
      replacementCardCount: selected.length,
      installedIceCount: server.ice.length,
      installedRootCount: server.root.length,
    }),
    serverId: server.id,
    orderedFortRebuildChoiceOpened: false,
    uninstalledCardsCount: removedCount,
    installedCardsCount: selected.length,
  };
  applyRunWindowPayloadPatch(legalAction, payload);
  return { publicPayload: payload };
}

function legalFortReplacementHqCardIds(
  state: GameState,
  server: CorpServer,
  removedCount: number,
): CardInstanceId[] {
  if (removedCount <= 0) return [];
  if (!hasLegalFortReplacementHqCombination(state, server, removedCount))
    return [];
  const serverAfterRemoval: CorpServer = { ...server, ice: [], root: [] };
  return state.corp.hq
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      if (definition.type === "ice") return true;
      if (!isFortReplacementInstallableCandidateDefinition(definition))
        return false;
      return canInstallCorpRootCardInServer(
        state,
        definition,
        serverAfterRemoval,
      );
    })
    .sort();
}

function hasLegalFortReplacementHqCombination(
  state: GameState,
  server: CorpServer,
  count: number,
): boolean {
  const candidates = state.corp.hq
    .filter((cardId) =>
      isFortReplacementInstallableCandidateDefinition(definitionFor(state, cardId)),
    )
    .sort();
  const visit = (startIndex: number, selected: CardInstanceId[]): boolean => {
    if (selected.length === count)
      return Boolean(validFortReplacementInstallOrder(state, server, selected));
    for (let index = startIndex; index < candidates.length; index += 1) {
      selected.push(candidates[index]!);
      if (visit(index + 1, selected)) return true;
      selected.pop();
    }
    return false;
  };
  return visit(0, []);
}

function validFortReplacementInstallOrder(
  state: GameState,
  server: CorpServer,
  selected: CardInstanceId[],
): CardInstanceId[] | undefined {
  if (new Set(selected).size !== selected.length) return undefined;
  if (selected.some((cardId) => !state.corp.hq.includes(cardId)))
    return undefined;
  if (
    selected.some(
      (cardId) =>
        !isFortReplacementInstallableCandidateDefinition(definitionFor(state, cardId)),
    )
  )
    return undefined;
  return firstValidFortReplacementInstallPermutation(state, server, selected, []);
}

function firstValidFortReplacementInstallPermutation(
  state: GameState,
  server: CorpServer,
  remaining: CardInstanceId[],
  prefix: CardInstanceId[],
): CardInstanceId[] | undefined {
  if (remaining.length === 0)
    return fortReplacementInstallOrderIsLegal(state, server, prefix)
      ? prefix
      : undefined;
  for (let index = 0; index < remaining.length; index += 1) {
    const next = remaining[index]!;
    const result = firstValidFortReplacementInstallPermutation(
      state,
      server,
      remaining.filter((_, candidateIndex) => candidateIndex !== index),
      [...prefix, next],
    );
    if (result) return result;
  }
  return undefined;
}

function fortReplacementInstallOrderIsLegal(
  state: GameState,
  server: CorpServer,
  order: CardInstanceId[],
): boolean {
  const testState = cloneState(state);
  const testServer = mustServer(testState, server.id);
  testServer.ice = [];
  testServer.root = [];
  for (const cardId of order) {
    const definition = definitionFor(testState, cardId);
    if (definition.type === "ice") {
      removeFromAllZones(testState, cardId);
      testServer.ice.push(cardId);
      testState.cardInstances[cardId] = {
        ...mustInstance(testState.cardInstances, cardId),
        zone: { side: "corp", zone: "serverIce", serverId: testServer.id },
      };
      continue;
    }
    if (!canInstallCorpRootCardInServer(testState, definition, testServer))
      return false;
    removeFromAllZones(testState, cardId);
    testServer.root.push(cardId);
    testState.cardInstances[cardId] = {
      ...mustInstance(testState.cardInstances, cardId),
      zone: { side: "corp", zone: "serverRoot", serverId: testServer.id },
    };
    if (
      corpRootMainCardIdsInServer(testState, testServer).length >
      corpRootAgendaOrNodeCapacityInServer(testState, testServer)
    )
      return false;
  }
  return true;
}

function isFortReplacementInstallableCandidateDefinition(
  definition: CardDefinition,
): boolean {
  return (
    definition.side === "corp" &&
    (definition.type === "ice" ||
      definition.type === "asset" ||
      definition.type === "agenda" ||
      definition.type === "upgrade")
  );
}

function openFortHqReplacementChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  server: CorpServer,
  replacementCount: number,
  legalCandidates: CardInstanceId[],
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `fort_hq_replacement_${state.stateVersion + 1}`,
    side: "corp",
    source: `card_implementation.fort_hq_replacement:${sourceCardId}:${sourceDefinitionId}:${server.id}:${replacementCount}:${state.stateVersion + 1}`,
    prompt: "HQ-Ersatzkarten waehlen",
    kind: "select_cards",
    options: legalCandidates.map((cardId) => ({
      id: `card_${cardId}`,
      label: definitionFor(state, cardId).title,
      publicLabel: "HQ-Karte",
      value: cardId,
    })),
    minSelections: replacementCount,
    maxSelections: replacementCount,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  state.activeSide = "corp";
}

export function resolveFortHqReplacementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice?.source.startsWith("card_implementation.fort_hq_replacement"))
    throw new Error("Es ist keine Fort-Ersatz-Choice offen.");
  const [, sourceCardId = "", sourceDefinitionId = "", , count = ""] =
    choice.source.split(":");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  if (selectedIds.length !== Number(count))
    throw new Error("Fort-Ersatz braucht exakt die geforderte Ersatzkartenzahl.");
  delete state.pendingChoice;
  replaceFortCardsFromHq(
    state,
    legalAction,
    sourceCardId as CardInstanceId,
    sourceDefinitionId as CardDefinitionId,
    selectedIds,
  );
}
