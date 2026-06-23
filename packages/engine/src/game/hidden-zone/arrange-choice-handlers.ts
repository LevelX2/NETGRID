import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
  Side,
} from "@netgrid/shared";
import {
  isP358FortressRespecificationChoiceSource,
  isP358NewBloodReorderChoiceSource,
} from "../../compatibility/payload-compatibility";

type HiddenZonePayload = Record<string, string | number | boolean>;

export type InstalledIceSlot = {
  server: CorpServer;
  serverId: Exclude<ServerId, "new_remote">;
  index: number;
  cardId: CardInstanceId;
};

export type HiddenZoneArrangeChoiceHandlerHost = {
  state: Pick<
    GameState,
    | "runner"
    | "corp"
    | "cardInstances"
    | "pendingChoice"
    | "stateVersion"
    | "run"
    | "activeSide"
  >;
  legalAction: LegalAction;
  playerAction?: PlayerAction;
  constants: {
    corpRdTop5ReorderOperationCardId: CardDefinitionId;
    roninAroundId: CardDefinitionId;
    tooManyDoorsId: CardDefinitionId;
  };
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    hiddenReplacementLongtailKind: (definitionId: CardDefinitionId) => string | undefined;
    isHiddenZoneReorderAssetDefinition: (definitionId: CardDefinitionId) => boolean;
    hasCorpUtilityKind: (cardId: CardInstanceId, kind: string) => boolean;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    rezzedCorpRootCardIds: () => CardInstanceId[];
  };
  servers: {
    mustServer: (serverId: string) => CorpServer;
    publicServerLabel: (serverId: string) => string | undefined;
  };
  choices: {
    iceChoiceLabelForSide: (
      cardId: CardInstanceId,
      visibleTo: Side,
      fallback: string,
    ) => { label: string; publicLabel: string };
  };
  callbacks: {
    runnerTurnFlags: () => {
      successfulRunThisTurn?: boolean;
      lastSuccessfulRunServerId?: string;
    };
  };
};

export type HiddenZoneArrangeChoiceHandlerResult = {
  handled: boolean;
  stateChanged?: boolean;
  deletePendingChoice?: boolean;
  movedCardIds?: CardInstanceId[];
  reorderedCardIds?: CardInstanceId[];
  selectedCardId?: CardInstanceId;
  sourceZone?: "heap" | "stack" | "rd" | "server_ice";
  destinationZone?: "grip" | "stack" | "rd" | "server_ice";
  resolvedPayload?: HiddenZonePayload;
};

export function handleHiddenZoneArrangeChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
): HiddenZoneArrangeChoiceHandlerResult {
  const source = host.state.pendingChoice?.source ?? "";
  if (
    source.startsWith("v098.arrange_stack_top2") ||
    source.startsWith("v1911.arrange_stack_top2")
  )
    return resolveRunnerStackArrangeChoice(host);
  if (source.startsWith("v1911.corp_rd_arrange_top2"))
    return resolveCorpRdArrangeChoice(host);
  if (source.startsWith("v1917.corp_rd_arrange_top2"))
    return resolveCorpAssetRdTopReorderChoice(host);
  if (source.startsWith("v1922.corp_rd_arrange_top5"))
    return resolveCorpRdTopReorderChoice(host);
  if (
    source.startsWith("v1922.runner_stack_top5_choose_one_arrange_rest") ||
    source.startsWith("p3_37.runner_stack_top5_choose_one_arrange_rest")
  )
    return resolveRunnerStackTop5Choice(host);
  if (isP358FortressRespecificationChoiceSource(source))
    return resolveSuccessfulRunFortIceReorderChoice(host);
  if (isP358NewBloodReorderChoiceSource(source))
    return resolveConcealAndReorderInstalledIceChoice(host);
  return { handled: false };
}

export function startRunnerStackArrangeChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
  input: {
    sourcePrefix?: string;
    choiceIdPrefix?: string;
  } = {},
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const topCards = host.state.runner.stack.slice(0, 2);
  if (topCards.length < 2) throw new Error("Nicht genug Karten fuer Arrange.");
  const sourcePrefix = input.sourcePrefix ?? "v098.arrange_stack_top2";
  const choiceIdPrefix = input.choiceIdPrefix ?? "v098_arrange_stack_top2";
  host.state.pendingChoice = {
    choiceId: `${choiceIdPrefix}_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `${sourcePrefix}:${host.state.stateVersion + 1}`,
    prompt: "Top 2 Karten anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

export function startRunnerStackTop5Choice(
  host: HiddenZoneArrangeChoiceHandlerHost,
  input: {
    sourceCardId: string;
    sourcePrefix?: string;
    count?: number;
  },
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const sourcePrefix = input.sourcePrefix ?? "v1922";
  const count = input.count ?? 5;
  const topCards = host.state.runner.stack.slice(0, count);
  if (topCards.length === 0) throw new Error("Der Stack ist leer.");
  host.state.pendingChoice = {
    choiceId: `${sourcePrefix}_runner_stack_top5_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `${sourcePrefix}.runner_stack_top5_choose_one_arrange_rest:${input.sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Stack-Spitze wählen und anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

export function startCardImplementationLookTopStackTakeOneArrangeRestChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
  input: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    count: 5;
  },
): { publicPayload: HiddenZonePayload } {
  startRunnerStackTop5Choice(host, {
    sourceCardId: input.sourceCardId,
    sourcePrefix: "p3_37",
    count: input.count,
  });
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
    sourceDefinitionId: input.sourceDefinitionId,
    privateLookCount: Math.min(input.count, host.state.runner.stack.length),
  };
  host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
  return { publicPayload: payload };
}

export function moveTopTrashToGripForCardImplementation(
  host: HiddenZoneArrangeChoiceHandlerHost,
  input: {
    sourceDefinitionId: CardDefinitionId;
  },
): { publicPayload: HiddenZonePayload } {
  const targetCardId = topRunnerHeapCardId(host);
  if (!targetCardId) throw new Error("Der Runner-Trash ist leer.");
  const boundTargetId = String(
    host.legalAction.payload?.cardImplementationTopTrashTargetId ?? "",
  );
  if (boundTargetId && boundTargetId !== targetCardId)
    throw new Error("Die oberste Trash-Karte hat sich geaendert.");
  const targetDefinition = host.cards.definitionFor(targetCardId);
  host.zones.removeFromAllZones(targetCardId);
  host.state.runner.grip.unshift(targetCardId);
  host.state.cardInstances[targetCardId] = {
    ...host.cards.mustInstance(targetCardId),
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_38_move_top_trash_to_grip",
    sourceDefinitionId: input.sourceDefinitionId,
    returnedCardDefinitionId: targetDefinition.id,
    returnedCount: 1,
    movedCardCount: 1,
    sourceZone: "heap",
    searchedZone: "runner_heap",
    destinationZone: "grip",
    returnedToGrip: true,
    runnerCreditsAfter: host.state.runner.credits,
  };
  host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
  return { publicPayload: payload };
}

export function startCorpRdArrangeChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
  input: {
    sourceIceId: CardInstanceId;
    subroutineIndex: number;
    updatePayload?: boolean;
  },
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const topCards = host.state.corp.rd.slice(0, 2);
  if (topCards.length < 2)
    throw new Error("Nicht genug Karten fuer R&D-Arrange.");
  host.state.pendingChoice = {
    choiceId: `v1911_corp_rd_arrange_top2_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v1911.corp_rd_arrange_top2:${input.sourceIceId}:${input.subroutineIndex}:${host.state.stateVersion + 1}`,
    prompt: "R&D-Spitze anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  if (input.updatePayload) {
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_corp_reorder_rd_top2",
      arrangedCount: topCards.length,
    };
  }
}

export function startCorpAssetRdTopReorderChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
  sourceCardId: CardInstanceId,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const sourceDefinition = host.cards.definitionFor(sourceCardId);
  if (!host.cards.isHiddenZoneReorderAssetDefinition(sourceDefinition.id))
    throw new Error(
      "Diese Karte darf keine V1.9.17-R&D-Reorder-Choice oeffnen.",
    );
  const topCards = host.state.corp.rd.slice(0, 2);
  if (topCards.length < 2)
    throw new Error("Nicht genug Karten fuer R&D-Reorder.");
  host.state.pendingChoice = {
    choiceId: `v1917_corp_rd_arrange_top2_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v1917.corp_rd_arrange_top2:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "R&D-Spitze anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_corp_reorder_rd_top2",
    arrangedCount: topCards.length,
  };
}

export function startCorpRdTopReorderChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
  sourceCardId: CardInstanceId,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (!isPlanningConsultantsSource(host, sourceCardId))
    throw new Error("Die R&D-Reorder-Quelle ist nicht Planning Consultants.");
  const topCards = host.state.corp.rd.slice(0, 5);
  if (topCards.length < 2)
    throw new Error("Nicht genug Karten fuer Planning Consultants.");
  host.state.pendingChoice = {
    choiceId: `v1922_corp_rd_arrange_top5_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v1922.corp_rd_arrange_top5:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "R&D-Spitze anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_corp_rd_reorder_top5",
    arrangedCount: topCards.length,
  };
}

export function startSuccessfulRunFortIceReorderChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
  sourceCardId: string,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const flags = host.callbacks.runnerTurnFlags();
  if (!flags.successfulRunThisTurn)
    throw new Error(
      "Fortress Respecification benoetigt einen erfolgreichen Run in diesem Zug.",
    );
  const serverId = flags.lastSuccessfulRunServerId;
  if (!serverId)
    throw new Error("Kein letzter erfolgreicher Fort fuer Fortress Respecification.");
  const server = host.servers.mustServer(serverId);
  if (server.ice.length < 2) {
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "successful_run_fort_ice_reorder",
      serverId,
      reorderedIceCount: server.ice.length,
      concealedIceCount: concealedIceCountForCardIds(host, server.ice),
    };
    return;
  }
  host.state.pendingChoice = {
    choiceId: `successful_run_fort_ice_reorder_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `hidden_zone.successful_run_fort_ice_reorder:${sourceCardId}:${serverId}:${host.state.stateVersion + 1}`,
    prompt: "ICE auf dem letzten erfolgreichen Fort neu anordnen.",
    kind: "select_cards",
    options: server.ice.map((cardId, index) => {
      const fallback = `ICE Position ${index + 1}`;
      const labels = host.choices.iceChoiceLabelForSide(cardId, "runner", fallback);
      return {
        id: `card_${cardId}`,
        label: labels.label,
        publicLabel: labels.publicLabel,
        value: cardId,
      };
    }),
    minSelections: server.ice.length,
    maxSelections: server.ice.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

export function resolveConcealAndReorderInstalledIce(
  host: HiddenZoneArrangeChoiceHandlerHost,
): void {
  let concealedCount = 0;
  for (const slot of installedIceSlots(host)) {
    const instance = host.cards.mustInstance(slot.cardId);
    if (!instance.rezzed && instance.faceup) {
      host.state.cardInstances[slot.cardId] = { ...instance, faceup: false };
      concealedCount += 1;
    }
  }
  const slots = installedIceSlots(host);
  if (slots.length < 2) {
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "conceal_and_reorder_installed_ice",
      concealedIceCount: concealedCount,
      reorderedIceCount: slots.length,
    };
    return;
  }
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const sourceCardId = String(host.legalAction.payload?.cardId ?? "");
  host.state.pendingChoice = {
    choiceId: `conceal_and_reorder_installed_ice_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `hidden_zone.conceal_and_reorder_installed_ice:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Installierte ICE neu anordnen.",
    kind: "select_cards",
    options: slots.map((slot) => {
      const serverLabel = host.servers.publicServerLabel(slot.serverId) ?? slot.serverId;
      return {
        id: `card_${slot.cardId}`,
        label: `${host.cards.definitionFor(slot.cardId).title} (${serverLabel} ${slot.index + 1})`,
        publicLabel: `${serverLabel} ICE ${slot.index + 1}`,
        value: slot.cardId,
      };
    }),
    minSelections: slots.length,
    maxSelections: slots.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.state.activeSide = "corp";
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenOrderChoice: true,
    hiddenZoneAction: "conceal_and_reorder_installed_ice",
    concealedIceCount: concealedCount,
    reorderedIceCount: slots.length,
  };
}

function resolveRunnerStackArrangeChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
): HiddenZoneArrangeChoiceHandlerResult {
  const choice = requireChoice(host, "Es ist keine Arrange-Choice offen.");
  if (choice.source.startsWith("v1911.arrange_stack_top2:")) {
    const sourceCardId = choice.source.split(":")[1] as
      | CardInstanceId
      | undefined;
    if (
      !sourceCardId ||
      !host.state.runner.rig.resources.includes(sourceCardId) ||
      host.cards.definitionFor(sourceCardId).id !== host.constants.roninAroundId
    ) {
      throw new Error("Die Ronin-Around-Reorder-Quelle ist nicht mehr installiert.");
    }
  }
  const selectedIds = selectedChoiceCardIds(choice, requirePlayerAction(host));
  const topCards = host.state.runner.stack.slice(0, choice.options.length);
  validatePermutation(
    topCards,
    selectedIds,
    "Die Arrange-Auswahl ist unvollstaendig.",
    "Die Arrange-Auswahl enthaelt ungueltige Karten.",
  );
  host.state.runner.stack = [
    ...selectedIds,
    ...host.state.runner.stack.slice(topCards.length),
  ];
  for (const cardId of selectedIds) {
    host.state.cardInstances[cardId] = {
      ...host.cards.mustInstance(cardId),
      zone: { side: "runner", zone: "stack" },
    };
  }
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "arrange_stack",
    arrangedCount: selectedIds.length,
  };
  return {
    handled: true,
    stateChanged: true,
    reorderedCardIds: selectedIds,
    sourceZone: "stack",
    destinationZone: "stack",
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
  };
}

function resolveRunnerStackTop5Choice(
  host: HiddenZoneArrangeChoiceHandlerHost,
): HiddenZoneArrangeChoiceHandlerResult {
  const choice = requireChoice(host, "Es ist keine V1.9.22-Stack-Choice offen.");
  const selectedIds = selectedChoiceCardIds(choice, requirePlayerAction(host));
  const topCards = host.state.runner.stack.slice(0, choice.options.length);
  validatePermutation(
    topCards,
    selectedIds,
    "Die Stack-Auswahl ist unvollstaendig.",
    "Die Stack-Auswahl enthaelt ungueltige Karten.",
  );
  const chosenCard = selectedIds[0];
  if (!chosenCard)
    throw new Error("Es wurde keine Karte fuer die Grip gewaehlt.");
  const arrangedRest = selectedIds.slice(1);
  host.state.runner.stack = [
    ...arrangedRest,
    ...host.state.runner.stack.slice(topCards.length),
  ];
  host.state.runner.grip.push(chosenCard);
  host.state.cardInstances[chosenCard] = {
    ...host.cards.mustInstance(chosenCard),
    zone: { side: "runner", zone: "grip" },
  };
  for (const cardId of arrangedRest) {
    host.state.cardInstances[cardId] = {
      ...host.cards.mustInstance(cardId),
      zone: { side: "runner", zone: "stack" },
    };
  }
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
    selectedCount: 1,
    arrangedCount: arrangedRest.length,
  };
  return {
    handled: true,
    stateChanged: true,
    movedCardIds: [chosenCard],
    reorderedCardIds: arrangedRest,
    selectedCardId: chosenCard,
    sourceZone: "stack",
    destinationZone: "grip",
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
  };
}

function resolveCorpRdArrangeChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
): HiddenZoneArrangeChoiceHandlerResult {
  const choice = requireChoice(host, "Es ist keine R&D-Arrange-Choice offen.");
  if (!choice.source.startsWith("v1911.corp_rd_arrange_top2"))
    throw new Error("Es ist keine R&D-Arrange-Choice offen.");
  const [, sourceIceId, subroutineIndexRaw] = choice.source.split(":");
  if (
    !sourceIceId ||
    host.cards.definitionFor(sourceIceId).id !== host.constants.tooManyDoorsId
  )
    throw new Error("Die R&D-Arrange-Choice gehoert nicht zu Too Many Doors.");
  const subroutineIndex = Number(subroutineIndexRaw);
  if (!Number.isInteger(subroutineIndex) || subroutineIndex < 0)
    throw new Error("Die R&D-Arrange-Subroutine ist ungueltig.");
  const run = requireRun(host);
  if (run.encounteredIceId !== sourceIceId)
    throw new Error(
      "Die R&D-Arrange-Choice gehoert nicht mehr zum aktuellen Encounter.",
    );
  const selectedIds = selectedChoiceCardIds(choice, requirePlayerAction(host));
  reorderCorpRdTop(host, selectedIds, choice.options.length, {
    incompleteMessage: "Die R&D-Arrange-Auswahl ist unvollstaendig.",
    invalidMessage: "Die R&D-Arrange-Auswahl enthaelt ungueltige Karten.",
  });
  if (!run.resolvedSubroutineIndexes.includes(subroutineIndex))
    run.resolvedSubroutineIndexes.push(subroutineIndex);
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1911_corp_reorder_rd_top2",
    arrangedCount: selectedIds.length,
  };
  return resolvedCorpRdResult(host, selectedIds);
}

function resolveCorpAssetRdTopReorderChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
): HiddenZoneArrangeChoiceHandlerResult {
  const choice = requireChoice(host, "Es ist keine V1.9.17-R&D-Reorder-Choice offen.");
  if (!choice.source.startsWith("v1917.corp_rd_arrange_top2"))
    throw new Error("Es ist keine V1.9.17-R&D-Reorder-Choice offen.");
  const [, sourceCardId] = choice.source.split(":");
  if (
    !sourceCardId ||
    !host.zones.rezzedCorpRootCardIds().includes(sourceCardId)
  )
    throw new Error(
      "Die V1.9.17-R&D-Reorder-Quelle ist nicht mehr rezzed installiert.",
    );
  if (
    !host.cards.isHiddenZoneReorderAssetDefinition(
      host.cards.definitionFor(sourceCardId).id,
    )
  )
    throw new Error(
      "Die V1.9.17-R&D-Reorder-Choice gehoert nicht zur passenden Karte.",
    );
  const selectedIds = selectedChoiceCardIds(choice, requirePlayerAction(host));
  reorderCorpRdTop(host, selectedIds, choice.options.length, {
    incompleteMessage: "Die V1.9.17-R&D-Reorder-Auswahl ist unvollstaendig.",
    invalidMessage:
      "Die V1.9.17-R&D-Reorder-Auswahl enthaelt ungueltige Karten.",
  });
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_corp_reorder_rd_top2",
    arrangedCount: selectedIds.length,
  };
  return resolvedCorpRdResult(host, selectedIds);
}

function resolveCorpRdTopReorderChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
): HiddenZoneArrangeChoiceHandlerResult {
  const choice = requireChoice(host, "Es ist keine V1.9.22-R&D-Reorder-Choice offen.");
  if (!choice.source.startsWith("v1922.corp_rd_arrange_top5"))
    throw new Error("Es ist keine V1.9.22-R&D-Reorder-Choice offen.");
  const [, sourceCardId] = choice.source.split(":");
  if (!sourceCardId || !isPlanningConsultantsSource(host, sourceCardId))
    throw new Error(
      "Die V1.9.22-R&D-Reorder-Choice gehoert nicht zu Planning Consultants.",
    );
  const selectedIds = selectedChoiceCardIds(choice, requirePlayerAction(host));
  reorderCorpRdTop(host, selectedIds, choice.options.length, {
    incompleteMessage: "Die V1.9.22-R&D-Reorder-Auswahl ist unvollstaendig.",
    invalidMessage:
      "Die V1.9.22-R&D-Reorder-Auswahl enthaelt ungueltige Karten.",
  });
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_corp_rd_reorder_top5",
    arrangedCount: selectedIds.length,
  };
  return resolvedCorpRdResult(host, selectedIds);
}

function resolveSuccessfulRunFortIceReorderChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
): HiddenZoneArrangeChoiceHandlerResult {
  const choice = requireChoice(
    host,
    "Es ist keine Fortress-Respecification-Choice offen.",
  );
  if (!isP358FortressRespecificationChoiceSource(choice.source))
    throw new Error("Es ist keine Fortress-Respecification-Choice offen.");
  const [, sourceCardId = "", serverId = ""] = choice.source.split(":");
  const sourceDefinition = host.cards.definitionFor(sourceCardId);
  if (
    host.cards.hiddenReplacementLongtailKind(sourceDefinition.id) !==
    "successful_run_fort_ice_reorder"
  )
    throw new Error("Die Fortress-Respecification-Quelle passt nicht zur Karte.");
  const server = host.servers.mustServer(serverId);
  const selectedIds = selectedChoiceCardIds(choice, requirePlayerAction(host));
  validateReorderSelection(
    server.ice,
    selectedIds,
    "Die Fortress-Respecification-Reihenfolge ist nicht legal.",
  );
  server.ice = [...selectedIds];
  server.ice.forEach((cardId) => {
    const instance = host.cards.mustInstance(cardId);
    host.state.cardInstances[cardId] = {
      ...instance,
      zone: { side: "corp", zone: "serverIce", serverId: server.id },
    };
  });
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenOrderChoice: true,
    hiddenZoneAction: "successful_run_fort_ice_reorder",
    sourceDefinitionId: sourceDefinition.id,
    serverId: server.id,
    reorderedIceCount: selectedIds.length,
    concealedIceCount: concealedIceCountForCardIds(host, selectedIds),
  };
  return {
    handled: true,
    stateChanged: true,
    reorderedCardIds: selectedIds,
    sourceZone: "server_ice",
    destinationZone: "server_ice",
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
  };
}

function resolveConcealAndReorderInstalledIceChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
): HiddenZoneArrangeChoiceHandlerResult {
  const choice = requireChoice(host, "Es ist keine New-Blood-Reorder-Choice offen.");
  if (!isP358NewBloodReorderChoiceSource(choice.source))
    throw new Error("Es ist keine New-Blood-Reorder-Choice offen.");
  const [, sourceCardId = ""] = choice.source.split(":");
  const sourceDefinition = host.cards.definitionFor(sourceCardId);
  if (
    host.cards.hiddenReplacementLongtailKind(sourceDefinition.id) !==
    "conceal_and_reorder_installed_ice"
  )
    throw new Error("Die New-Blood-Quelle passt nicht zur Karte.");
  const slots = installedIceSlots(host);
  const currentIds = slots.map((slot) => slot.cardId);
  const selectedIds = selectedChoiceCardIds(choice, requirePlayerAction(host));
  validateReorderSelection(
    currentIds,
    selectedIds,
    "Die New-Blood-Reihenfolge ist nicht legal.",
  );
  slots.forEach((slot, index) => {
    const cardId = selectedIds[index]!;
    slot.server.ice[slot.index] = cardId;
    const instance = host.cards.mustInstance(cardId);
    host.state.cardInstances[cardId] = {
      ...instance,
      zone: { side: "corp", zone: "serverIce", serverId: slot.serverId },
    };
  });
  delete host.state.pendingChoice;
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenOrderChoice: true,
    hiddenZoneAction: "conceal_and_reorder_installed_ice",
    sourceDefinitionId: sourceDefinition.id,
    reorderedIceCount: selectedIds.length,
    concealedIceCount: concealedIceCountForCardIds(host, selectedIds),
  };
  return {
    handled: true,
    stateChanged: true,
    reorderedCardIds: selectedIds,
    sourceZone: "server_ice",
    destinationZone: "server_ice",
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
  };
}

function reorderCorpRdTop(
  host: HiddenZoneArrangeChoiceHandlerHost,
  selectedIds: readonly CardInstanceId[],
  count: number,
  messages: { incompleteMessage: string; invalidMessage: string },
): void {
  const topCards = host.state.corp.rd.slice(0, count);
  validatePermutation(
    topCards,
    selectedIds,
    messages.incompleteMessage,
    messages.invalidMessage,
  );
  host.state.corp.rd = [...selectedIds, ...host.state.corp.rd.slice(topCards.length)];
  for (const cardId of selectedIds) {
    host.state.cardInstances[cardId] = {
      ...host.cards.mustInstance(cardId),
      zone: { side: "corp", zone: "rd" },
    };
  }
}

function resolvedCorpRdResult(
  host: HiddenZoneArrangeChoiceHandlerHost,
  selectedIds: CardInstanceId[],
): HiddenZoneArrangeChoiceHandlerResult {
  return {
    handled: true,
    stateChanged: true,
    reorderedCardIds: selectedIds,
    sourceZone: "rd",
    destinationZone: "rd",
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
  };
}

function installedIceSlots(host: HiddenZoneArrangeChoiceHandlerHost): InstalledIceSlot[] {
  const slots: InstalledIceSlot[] = [];
  for (const server of host.state.corp.servers) {
    for (let index = 0; index < server.ice.length; index += 1) {
      slots.push({
        server,
        serverId: server.id,
        index,
        cardId: server.ice[index]!,
      });
    }
  }
  return slots;
}

function concealedIceCountForCardIds(
  host: HiddenZoneArrangeChoiceHandlerHost,
  cardIds: readonly CardInstanceId[],
): number {
  return cardIds.filter((cardId) => {
    const instance = host.state.cardInstances[cardId];
    return instance && !instance.rezzed && !instance.faceup;
  }).length;
}

function topRunnerHeapCardId(
  host: HiddenZoneArrangeChoiceHandlerHost,
): CardInstanceId | undefined {
  return host.state.runner.heap.at(-1);
}

function isPlanningConsultantsSource(
  host: HiddenZoneArrangeChoiceHandlerHost,
  sourceCardId: CardInstanceId,
): boolean {
  return (
    host.cards.definitionFor(sourceCardId).id ===
      host.constants.corpRdTop5ReorderOperationCardId ||
    host.cards.hasCorpUtilityKind(sourceCardId, "corp_rd_top_reorder")
  );
}

function selectedChoiceCardIds(
  choice: ChoiceRequest,
  playerAction: PlayerAction,
): CardInstanceId[] {
  return selectedChoiceIds(playerAction.selectedChoices).map((optionId) => {
    const option = choice.options.find(
      (candidate) => candidate.id === optionId,
    );
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value;
  });
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

function validatePermutation(
  currentIds: readonly CardInstanceId[],
  selectedIds: readonly CardInstanceId[],
  incompleteMessage: string,
  invalidMessage: string,
): void {
  if (selectedIds.length !== currentIds.length) throw new Error(incompleteMessage);
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    currentIds.some((cardId) => !selectedSet.has(cardId))
  )
    throw new Error(invalidMessage);
}

function validateReorderSelection(
  currentIds: readonly CardInstanceId[],
  selectedIds: readonly CardInstanceId[],
  message: string,
): void {
  if (selectedIds.length !== currentIds.length) throw new Error(message);
  const current = [...currentIds].sort();
  const selected = [...selectedIds].sort();
  if (current.some((cardId, index) => cardId !== selected[index]))
    throw new Error(message);
}

function requireChoice(
  host: HiddenZoneArrangeChoiceHandlerHost,
  message: string,
): ChoiceRequest {
  const choice = host.state.pendingChoice;
  if (!choice) throw new Error(message);
  return choice;
}

function requirePlayerAction(host: HiddenZoneArrangeChoiceHandlerHost): PlayerAction {
  if (!host.playerAction) throw new Error("PlayerAction fehlt fuer diese Choice.");
  return host.playerAction;
}

function requireRun(
  host: HiddenZoneArrangeChoiceHandlerHost,
): NonNullable<GameState["run"]> {
  if (!host.state.run) throw new Error("Es läuft kein Run.");
  return host.state.run;
}
