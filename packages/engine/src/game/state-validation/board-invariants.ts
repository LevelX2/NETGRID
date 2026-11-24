import type { CardInstance, CardInstanceId, GameState } from "@netgrid/shared";
import { definitionFor } from "../state/card-server-lookup";
import { corpServerIdsAreCanonicalAndUnique } from "../state/remote-server-id";

export function validateCardPlacement(
  errors: string[],
  state: GameState,
): void {
  const placements = new Map<CardInstanceId, string>();
  const addPlacement = (id: CardInstanceId, zone: string) => {
    if (placements.has(id))
      errors.push(`CardInstance ${id} appears multiple times.`);
    placements.set(id, zone);
    if (!state.cardInstances[id])
      errors.push(`Zone references missing CardInstance ${id}.`);
  };

  addPlacement(state.corp.identity, "corp.identity");
  addPlacement(state.runner.identity, "runner.identity");
  if (!corpServerIdsAreCanonicalAndUnique(state.corp.servers))
    errors.push("Corp server IDs must be canonical and unique.");
  for (const id of state.corp.hq) addPlacement(id, "corp.hq");
  for (const id of state.corp.rd) addPlacement(id, "corp.rd");
  for (const id of state.corp.archives) addPlacement(id, "corp.archives");
  for (const id of state.corp.scoreArea) addPlacement(id, "corp.scoreArea");
  for (const server of state.corp.servers) {
    for (const id of server.ice) addPlacement(id, `${server.id}.ice`);
    for (const id of server.root) addPlacement(id, `${server.id}.root`);
  }
  for (const id of state.runner.grip) addPlacement(id, "runner.grip");
  for (const id of state.runner.stack) addPlacement(id, "runner.stack");
  for (const id of state.runner.heap) addPlacement(id, "runner.heap");
  for (const id of state.runner.scoreArea) addPlacement(id, "runner.scoreArea");
  for (const id of state.runner.rig.programs)
    addPlacement(id, "runner.rig.programs");
  for (const id of state.runner.rig.hardware)
    addPlacement(id, "runner.rig.hardware");
  for (const id of state.runner.rig.resources)
    addPlacement(id, "runner.rig.resources");
  for (const id of state.specialZones?.setAside ?? [])
    addPlacement(id, "special.set_aside");
  for (const id of state.specialZones?.removedFromGame ?? [])
    addPlacement(id, "special.removed_from_game");

  for (const id of Object.keys(state.cardInstances)) {
    if (!placements.has(id))
      errors.push(`CardInstance ${id} is not in any zone.`);
  }

  for (const [id, instance] of Object.entries(state.cardInstances)) {
    const placement = placements.get(id);
    const expected = placementForZoneRef(instance.zone);
    if (
      id !== state.corp.identity &&
      id !== state.runner.identity &&
      placement &&
      expected &&
      placement !== expected
    ) {
      errors.push(
        `CardInstance ${id} zoneRef ${expected} does not match placement ${placement}.`,
      );
    }
    if (instance.owner !== "corp" && instance.owner !== "runner")
      errors.push(`CardInstance ${id} has invalid owner.`);
    if (instance.controller !== "corp" && instance.controller !== "runner")
      errors.push(`CardInstance ${id} has invalid controller.`);
    if (instance.zone.side === "special") {
      if (
        instance.zone.zone !== "set_aside" &&
        instance.zone.zone !== "removed_from_game"
      )
        errors.push(`CardInstance ${id} has invalid special zone.`);
      if (
        instance.zone.visibility !== "public" &&
        instance.zone.visibility !== "side_private" &&
        instance.zone.visibility !== "hidden" &&
        instance.zone.visibility !== "replay_only"
      ) {
        errors.push(`CardInstance ${id} has invalid special zone visibility.`);
      }
      if (
        instance.zone.zone === "removed_from_game" &&
        instance.zone.returnZone
      )
        errors.push(
          `Removed-from-game CardInstance ${id} must not have a return zone.`,
        );
    }
  }
}

export function validateRigAndCounters(
  errors: string[],
  state: GameState,
): void {
  for (const id of state.runner.rig.programs) {
    const instance = state.cardInstances[id];
    if (
      definitionFor(state, id).type !== "program" &&
      !instance?.installedAsRunnerProgram
    )
      errors.push(`Runner rig program slot contains non-program ${id}.`);
  }
  for (const id of state.runner.rig.hardware) {
    if (definitionFor(state, id).type !== "hardware")
      errors.push(`Runner rig hardware slot contains non-hardware ${id}.`);
  }
  for (const id of state.runner.rig.resources) {
    if (definitionFor(state, id).type !== "resource")
      errors.push(`Runner rig resource slot contains non-resource ${id}.`);
  }
  for (const [id, instance] of Object.entries(state.cardInstances)) {
    for (const [counterType, amount] of Object.entries(
      instance.counters ?? {},
    )) {
      if (!Number.isInteger(amount) || amount < 0)
        errors.push(
          `Counter ${counterType} on ${id} must be a non-negative integer.`,
        );
    }
    if (instance.hostedOn) {
      if (instance.hostedOn === id)
        errors.push(`CardInstance ${id} cannot host itself.`);
      if (!state.cardInstances[instance.hostedOn])
        errors.push(
          `CardInstance ${id} references missing host ${instance.hostedOn}.`,
        );
      if (hasHostingCycle(state, id))
        errors.push(`CardInstance ${id} has a hosting cycle.`);
    }
  }
}

function placementForZoneRef(zone: CardInstance["zone"]): string | undefined {
  if (zone.side === "corp" && zone.zone === "hq") return "corp.hq";
  if (zone.side === "corp" && zone.zone === "rd") return "corp.rd";
  if (zone.side === "corp" && zone.zone === "archives") return "corp.archives";
  if (zone.side === "corp" && zone.zone === "scoreArea")
    return "corp.scoreArea";
  if (zone.side === "corp" && zone.zone === "serverIce")
    return `${zone.serverId}.ice`;
  if (zone.side === "corp" && zone.zone === "serverRoot")
    return `${zone.serverId}.root`;
  if (zone.side === "runner" && zone.zone === "grip") return "runner.grip";
  if (zone.side === "runner" && zone.zone === "stack") return "runner.stack";
  if (zone.side === "runner" && zone.zone === "heap") return "runner.heap";
  if (zone.side === "runner" && zone.zone === "scoreArea")
    return "runner.scoreArea";
  if (zone.side === "runner" && zone.zone === "rig") {
    return undefined;
  }
  if (zone.side === "special" && zone.zone === "set_aside")
    return "special.set_aside";
  if (zone.side === "special" && zone.zone === "removed_from_game")
    return "special.removed_from_game";
  return undefined;
}

function hasHostingCycle(state: GameState, cardId: CardInstanceId): boolean {
  const seen = new Set<CardInstanceId>([cardId]);
  let current = state.cardInstances[cardId]?.hostedOn;
  while (current) {
    if (seen.has(current)) return true;
    seen.add(current);
    current = state.cardInstances[current]?.hostedOn;
  }
  return false;
}
