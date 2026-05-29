import type {
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
  Side,
  SpecialZoneKind,
  SpecialZoneState,
  SpecialZoneVisibility,
} from "@netgrid/shared";
import {
  definitionFor,
  mustInstance,
  runnerInstalledCardIds,
} from "../state/card-server-lookup";

type NonSpecialZone = Exclude<CardInstance["zone"], { side: "special" }>;

export type BoardStateActionExecutionHost = {
  state: GameState;
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    serverById: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => GameState["corp"]["servers"][number];
  };
  payment: {
    spendClick: (side: Side) => void;
    spendCredits: (side: Side, amount: number) => void;
  };
  runner: {
    resolveHiddenRunnerResourceSlot: (
      slotId: string,
    ) => CardInstanceId | undefined;
    isConcealedRunnerResource: (cardId: CardInstanceId) => boolean;
    hiddenRunnerResourceSlotId: (cardId: CardInstanceId) => CardInstanceId;
    trashInstalledCardToHeap: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  fort: {
    markRovingSubmarineActivityForServer: (
      serverId: Exclude<ServerId, "new_remote">,
      legalAction: LegalAction,
    ) => void;
  };
};

export type BoardStateActionExecutionResult = {
  handled: boolean;
};

export function handleBoardStateActionExecution(
  host: BoardStateActionExecutionHost,
  legalAction: LegalAction,
): BoardStateActionExecutionResult {
  switch (legalAction.type) {
    case "advance_card":
      executeAdvanceCardAction(host, legalAction);
      return { handled: true };
    case "trash_resource":
      trashResource(host, legalAction);
      return { handled: true };
    case "move_to_set_aside":
      moveToSpecialZone(host, legalAction, "set_aside");
      return { handled: true };
    case "move_to_removed_from_game":
      moveToSpecialZone(host, legalAction, "removed_from_game");
      return { handled: true };
    case "return_from_set_aside":
      returnFromSetAside(host, legalAction);
      return { handled: true };
    case "change_card_control":
      changeCardControl(host, legalAction);
      return { handled: true };
    default:
      return { handled: false };
  }
}

function executeAdvanceCardAction(
  host: BoardStateActionExecutionHost,
  legalAction: LegalAction,
): void {
  host.payment.spendClick("corp");
  host.payment.spendCredits("corp", 1);
  const advancedCardId = String(legalAction.payload?.cardId) as CardInstanceId;
  const instance = mustInstance(host.state.cardInstances, advancedCardId);
  instance.advancementCounters += 1;
  const zone = instance.zone;
  if (zone.side === "corp" && zone.zone === "serverRoot")
    host.fort.markRovingSubmarineActivityForServer(zone.serverId, legalAction);
}

function trashResource(
  host: BoardStateActionExecutionHost,
  legalAction: LegalAction,
): void {
  if (host.state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
  const cardId = String(
    legalAction.payload?.resourceId ?? legalAction.payload?.cardId ?? "",
  );
  const directCardId = cardId as CardInstanceId;
  const resolvedCardId = host.state.runner.rig.resources.includes(directCardId)
    ? directCardId
    : host.runner.resolveHiddenRunnerResourceSlot(cardId);
  if (!resolvedCardId || !host.state.runner.rig.resources.includes(resolvedCardId))
    throw new Error("Diese Resource ist nicht installiert.");
  const definition = definitionFor(host.state, resolvedCardId);
  if (definition.type !== "resource")
    throw new Error("Nur installierte Resources koennen getrasht werden.");
  const wasConcealedHiddenResource =
    host.runner.isConcealedRunnerResource(resolvedCardId);
  const hiddenResourceSlotId =
    host.runner.hiddenRunnerResourceSlotId(resolvedCardId);
  host.payment.spendClick("corp");
  host.payment.spendCredits("corp", 2);
  host.runner.trashInstalledCardToHeap(resolvedCardId, legalAction);
  if (wasConcealedHiddenResource) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      cardId: hiddenResourceSlotId,
      resourceSlotId: hiddenResourceSlotId,
      hiddenResourceSlotId,
      hiddenRunnerResource: true,
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: definition.id,
      redactedKind: "hidden_runner_resource",
    };
  }
}

function moveToSpecialZone(
  host: BoardStateActionExecutionHost,
  legalAction: LegalAction,
  zone: SpecialZoneKind,
): void {
  const cardId = stringLegalPayload(legalAction, "cardId") as CardInstanceId;
  const instance = mustInstance(host.state.cardInstances, cardId);
  const harness = host.state.specialZoneHarness;
  const harnessConfig =
    zone === "set_aside" ? harness?.setAside : harness?.removedFromGame;
  if (
    !harness ||
    harness.actor !== legalAction.side ||
    harness.cardInstanceId !== cardId ||
    !harnessConfig
  ) {
    throw new Error(
      "Special-Zone-Harness ist fuer diese Aktion nicht freigegeben.",
    );
  }
  if (instance.zone.side === "special")
    throw new Error("Karte liegt bereits in einer Spezialzone.");
  const previousZone = instance.zone as NonSpecialZone;
  const movedInstance = runnerInstalledCardIds(host.state).includes(cardId)
    ? cardInstanceWithoutCounters(instance)
    : instance;
  const visibility = specialZoneVisibilityPayload(
    legalAction,
    harnessConfig.visibility,
  );
  const visibilitySide = specialZoneVisibilitySidePayload(
    legalAction,
    harnessConfig.visibilitySide,
  );
  host.zones.removeFromAllZones(cardId);
  const specialZones = ensureSpecialZones(host.state);
  const target =
    zone === "set_aside" ? specialZones.setAside : specialZones.removedFromGame;
  target.push(cardId);
  target.sort();
  host.state.cardInstances[cardId] = {
    ...movedInstance,
    zone: {
      side: "special",
      zone,
      visibility,
      ...(visibilitySide ? { visibilitySide } : {}),
      ...(zone === "set_aside"
        ? { returnZone: harness.setAside?.returnZone ?? previousZone }
        : {}),
    },
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    specialZone: zone,
    specialZoneVisibility: visibility,
    ...(visibilitySide ? { specialZoneVisibilitySide: visibilitySide } : {}),
    specialZoneReason: String(
      legalAction.payload?.specialZoneReason ??
        harnessConfig.reason ??
        "v1.2.2_test_harness",
    ),
    redactedKind: "special_zone",
  };
}

function returnFromSetAside(
  host: BoardStateActionExecutionHost,
  legalAction: LegalAction,
): void {
  const cardId = stringLegalPayload(legalAction, "cardId") as CardInstanceId;
  const instance = mustInstance(host.state.cardInstances, cardId);
  const harness = host.state.specialZoneHarness;
  if (
    !harness?.setAside?.allowReturn ||
    harness.actor !== legalAction.side ||
    harness.cardInstanceId !== cardId
  ) {
    throw new Error("Rueckkehr aus Set Aside ist nur test-only freigegeben.");
  }
  if (instance.zone.side !== "special" || instance.zone.zone !== "set_aside")
    throw new Error("Karte liegt nicht in Set Aside.");
  const returnZone = harness.setAside.returnZone ?? instance.zone.returnZone;
  if (!returnZone)
    throw new Error("Keine Rueckkehrzone fuer Set Aside definiert.");
  host.zones.removeFromAllZones(cardId);
  placeCardInZone(host, cardId, returnZone);
  host.state.cardInstances[cardId] = {
    ...mustInstance(host.state.cardInstances, cardId),
    zone: returnZone,
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    specialZone: "set_aside",
    specialZoneReason: String(
      legalAction.payload?.specialZoneReason ??
        harness.setAside.reason ??
        "v1.2.2_test_harness_return",
    ),
    redactedKind: "special_zone",
  };
}

function changeCardControl(
  host: BoardStateActionExecutionHost,
  legalAction: LegalAction,
): void {
  const cardId = stringLegalPayload(legalAction, "cardId") as CardInstanceId;
  const instance = mustInstance(host.state.cardInstances, cardId);
  const newController = sideLegalPayload(legalAction, "newController");
  const harness = host.state.specialZoneHarness;
  if (
    !harness?.controlChange ||
    harness.actor !== legalAction.side ||
    harness.cardInstanceId !== cardId ||
    harness.controlChange.newController !== newController
  ) {
    throw new Error("Control-Wechsel ist fuer diese Aktion nicht freigegeben.");
  }
  if (instance.controller === newController)
    throw new Error("Die Karte hat diesen Controller bereits.");
  host.state.cardInstances[cardId] = { ...instance, controller: newController };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    oldController: instance.controller,
    newController,
    controlChangeVisibility: harness.controlChange.visibility ?? "public",
    controlChangeReason: harness.controlChange.reason ?? "v1.2.2_test_harness",
    ownershipChanged: false,
    redactedKind: "control_change",
  };
}

function placeCardInZone(
  host: BoardStateActionExecutionHost,
  cardId: CardInstanceId,
  zone: NonSpecialZone,
): void {
  if (zone.side === "corp" && zone.zone === "hq") host.state.corp.hq.push(cardId);
  else if (zone.side === "corp" && zone.zone === "rd")
    host.state.corp.rd.push(cardId);
  else if (zone.side === "corp" && zone.zone === "archives")
    host.state.corp.archives.push(cardId);
  else if (zone.side === "corp" && zone.zone === "scoreArea")
    host.state.corp.scoreArea.push(cardId);
  else if (zone.side === "corp" && zone.zone === "serverIce")
    host.zones.serverById(zone.serverId).ice.push(cardId);
  else if (zone.side === "corp" && zone.zone === "serverRoot")
    host.zones.serverById(zone.serverId).root.push(cardId);
  else if (zone.side === "runner" && zone.zone === "grip")
    host.state.runner.grip.push(cardId);
  else if (zone.side === "runner" && zone.zone === "stack")
    host.state.runner.stack.push(cardId);
  else if (zone.side === "runner" && zone.zone === "heap")
    host.state.runner.heap.push(cardId);
  else if (zone.side === "runner" && zone.zone === "scoreArea")
    host.state.runner.scoreArea.push(cardId);
  else if (zone.side === "runner" && zone.zone === "rig") {
    const definition = definitionFor(host.state, cardId);
    if (definition.type === "program") host.state.runner.rig.programs.push(cardId);
    else if (definition.type === "hardware")
      host.state.runner.rig.hardware.push(cardId);
    else if (definition.type === "resource")
      host.state.runner.rig.resources.push(cardId);
    else
      throw new Error(
        "Nur Runner-Programme, Hardware und Resources koennen in die Rig zurueckkehren.",
      );
  }
}

function ensureSpecialZones(state: GameState): SpecialZoneState {
  state.specialZones ??= { setAside: [], removedFromGame: [] };
  state.specialZones.setAside ??= [];
  state.specialZones.removedFromGame ??= [];
  return state.specialZones;
}

function cardInstanceWithoutCounters(instance: CardInstance): CardInstance {
  const { counters: _counters, ...withoutCounters } = instance;
  void _counters;
  return withoutCounters;
}

function specialZoneVisibilityPayload(
  legalAction: LegalAction,
  fallback: SpecialZoneVisibility,
): SpecialZoneVisibility {
  const value = legalAction.payload?.specialZoneVisibility;
  return value === "public" ||
    value === "side_private" ||
    value === "hidden" ||
    value === "replay_only"
    ? value
    : fallback;
}

function specialZoneVisibilitySidePayload(
  legalAction: LegalAction,
  fallback: Side | undefined,
): Side | undefined {
  const value = legalAction.payload?.specialZoneVisibilitySide;
  return value === "corp" || value === "runner" ? value : fallback;
}

function stringLegalPayload(legalAction: LegalAction, key: string): string {
  const value = legalAction.payload?.[key];
  if (typeof value !== "string" || value.length === 0)
    throw new Error(`Payload ${key} fehlt.`);
  return value;
}

function sideLegalPayload(legalAction: LegalAction, key: string): Side {
  const value = legalAction.payload?.[key];
  if (value !== "corp" && value !== "runner")
    throw new Error(`Payload ${key} ist keine Seite.`);
  return value;
}
