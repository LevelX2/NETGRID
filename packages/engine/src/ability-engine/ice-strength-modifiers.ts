import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type ServerId,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import type { CardIceStrengthModifierImplementation } from "./definition-types";

function mustInstance(
  instances: Record<CardInstanceId, CardInstance>,
  id: string,
): CardInstance {
  const instance = instances[id];
  if (!instance) throw new Error(`Unknown card instance ${id}`);
  return instance;
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = DEMO_CARDS_BY_ID[instance.definitionId];
  if (!definition) throw new Error(`Unknown card definition ${instance.definitionId}`);
  return definition;
}

function cardHasSubtype(definition: CardDefinition, subtype: string): boolean {
  const wanted = subtype.toLowerCase().replace(/\s+/g, "_");
  return definition.subtypes.some(
    (candidate) => candidate.toLowerCase().replace(/\s+/g, "_") === wanted,
  );
}

function corpServerIdForInstalledCard(
  state: GameState,
  cardId: CardInstanceId,
): Exclude<ServerId, "new_remote"> | undefined {
  const zone = state.cardInstances[cardId]?.zone;
  if (
    zone?.side === "corp" &&
    (zone.zone === "serverIce" || zone.zone === "serverRoot")
  )
    return zone.serverId as Exclude<ServerId, "new_remote">;
  return undefined;
}

function rezzedCorpRootCardIds(state: GameState): CardInstanceId[] {
  const ids: CardInstanceId[] = [];
  for (const server of state.corp.servers) {
    for (const cardId of server.root) {
      if (mustInstance(state.cardInstances, cardId).rezzed) ids.push(cardId);
    }
  }
  return ids;
}

function iceStrengthModifierAppliesToIce(
  state: GameState,
  modifier: CardIceStrengthModifierImplementation,
  sourceCardInstanceId: CardInstanceId,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): boolean {
  if (
    modifier.operation !== "increase" ||
    modifier.activeWhile !== "rezzed" ||
    modifier.sourceZone !== "corp_root" ||
    modifier.visibility !== "public"
  )
    return false;
  if (modifier.appliesTo.side !== "corp") return false;
  if (iceDefinition.type !== modifier.appliesTo.cardType) return false;
  if (
    modifier.appliesTo.subtype &&
    !cardHasSubtype(iceDefinition, modifier.appliesTo.subtype)
  )
    return false;
  if (modifier.appliesTo.sameServerAsSource) {
    const iceServerId = corpServerIdForInstalledCard(state, iceId);
    return (
      Boolean(iceServerId) &&
      corpServerIdForInstalledCard(state, sourceCardInstanceId) === iceServerId
    );
  }
  return true;
}

export function iceStrengthModifierBonusFor(
  state: GameState,
  iceId: CardInstanceId,
): number {
  const iceInstance = mustInstance(state.cardInstances, iceId);
  if (!iceInstance.rezzed) return 0;
  const iceDefinition = definitionFor(state, iceId);
  if (iceDefinition.type !== "ice") return 0;
  let bonus = 0;
  for (const sourceCardInstanceId of rezzedCorpRootCardIds(state)) {
    const sourceDefinitionId = definitionFor(state, sourceCardInstanceId).id;
    const sourceImplementation =
      cardImplementationForDefinitionId(sourceDefinitionId);
    for (const modifier of sourceImplementation?.modifiers ?? []) {
      if (modifier.kind !== "ice_strength") continue;
      if (
        !iceStrengthModifierAppliesToIce(
          state,
          modifier,
          sourceCardInstanceId,
          iceId,
          iceDefinition,
        )
      )
        continue;
      bonus += modifier.amount;
    }
  }
  return bonus;
}
