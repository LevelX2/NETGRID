/**
 * Queries active declarative CardImplementation modifiers from the board state.
 *
 * The helpers here are read-only and card-generic. They know source zones such
 * as rezzed Corp root, scored Corp agenda, and installed Runner card, but they
 * must not contain concrete card IDs or execute modifier effects themselves.
 */
import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type CardType,
  type GameState,
  type ServerId,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import type { CardModifierImplementation } from "./definition-types";

export type ActiveCardImplementationModifier<
  TModifier extends CardModifierImplementation = CardModifierImplementation,
> = {
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinition["id"];
  sourceDefinition: CardDefinition;
  modifier: TModifier;
};

export function cardInstanceFor(
  state: GameState,
  id: CardInstanceId,
): CardInstance {
  const instance = state.cardInstances[id];
  if (!instance) throw new Error(`Unknown card instance: ${id}`);
  return instance;
}

export function cardDefinitionForInstance(
  state: GameState,
  id: CardInstanceId,
): CardDefinition {
  const instance = cardInstanceFor(state, id);
  const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unknown card definition: ${instance.definitionId}`);
  return definition;
}

export function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function cardHasNormalizedSubtype(
  definition: CardDefinition,
  subtype: string,
): boolean {
  const target = normalizeSubtypeLabel(subtype);
  return definition.subtypes.some(
    (candidate) => normalizeSubtypeLabel(candidate) === target,
  );
}

export function cardMatchesModifierAppliesTo(
  definition: CardDefinition,
  appliesTo: { cardType: CardType; subtype?: string; subtypeAnyOf?: readonly string[] },
): boolean {
  if (definition.type !== appliesTo.cardType) return false;
  if (
    appliesTo.subtype &&
    !cardHasNormalizedSubtype(definition, appliesTo.subtype)
  )
    return false;
  if (
    appliesTo.subtypeAnyOf &&
    !appliesTo.subtypeAnyOf.some((subtype) =>
      cardHasNormalizedSubtype(definition, subtype),
    )
  )
    return false;
  return true;
}

export function corpServerIdForInstalledCard(
  state: GameState,
  cardId: CardInstanceId,
): Exclude<ServerId, "new_remote"> | undefined {
  const zone = cardInstanceFor(state, cardId).zone;
  if (
    zone.side === "corp" &&
    (zone.zone === "serverIce" || zone.zone === "serverRoot")
  )
    return zone.serverId;
  return undefined;
}

/**
 * Applies the shared same-server/source-fort predicate for server-scoped
 * modifiers. It reads current installed zones only and does not snapshot past
 * access or run state.
 */
export function sameServerAsSourceApplies(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
  targetCardInstanceId: CardInstanceId,
  sameServerAsSource?: boolean,
): boolean {
  if (!sameServerAsSource) return true;
  const targetServerId = corpServerIdForInstalledCard(state, targetCardInstanceId);
  return (
    Boolean(targetServerId) &&
    corpServerIdForInstalledCard(state, sourceCardInstanceId) === targetServerId
  );
}

export function rezzedCorpRootCardIds(state: GameState): CardInstanceId[] {
  const ids: CardInstanceId[] = [];
  for (const server of state.corp.servers) {
    for (const cardId of server.root) {
      if (cardInstanceFor(state, cardId).rezzed) ids.push(cardId);
    }
  }
  return ids;
}

export function rezzedCorpInstalledCardIds(state: GameState): CardInstanceId[] {
  const ids: CardInstanceId[] = [];
  for (const server of state.corp.servers) {
    for (const cardId of [...server.ice, ...server.root]) {
      if (cardInstanceFor(state, cardId).rezzed) ids.push(cardId);
    }
  }
  return ids;
}

export function runnerInstalledCardIds(state: GameState): CardInstanceId[] {
  return [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ];
}

export function scoredCorpAgendaIds(state: GameState): CardInstanceId[] {
  return state.corp.scoreArea.slice();
}

export function isPublicRezzedCorpRootModifier(
  modifier: Pick<
    CardModifierImplementation,
    "activeWhile" | "sourceZone" | "visibility"
  >,
): boolean {
  return (
    modifier.activeWhile === "rezzed" &&
    modifier.sourceZone === "corp_root" &&
    modifier.visibility === "public"
  );
}

export function isPublicRunnerInstalledModifier(
  modifier: Pick<
    CardModifierImplementation,
    "activeWhile" | "sourceZone" | "visibility"
  >,
): boolean {
  return (
    modifier.activeWhile === "installed" &&
    modifier.sourceZone === "runner_installed" &&
    modifier.visibility === "public"
  );
}

export function isPublicScoredCorpAgendaModifier(
  modifier: Pick<
    CardModifierImplementation,
    "activeWhile" | "sourceZone" | "visibility"
  >,
): boolean {
  return (
    modifier.activeWhile === "scored" &&
    modifier.sourceZone === "corp_scored_agenda" &&
    modifier.visibility === "public"
  );
}

/**
 * Returns active modifiers from currently rezzed Corp root cards.
 *
 * The query reads the current board state directly; it does not replay events,
 * persist access snapshots, or apply same-server filtering by itself.
 */
export function activeCardImplementationModifiersForCorpRoot<
  TKind extends CardModifierImplementation["kind"],
>(
  state: GameState,
  kind: TKind,
): ActiveCardImplementationModifier<
  Extract<CardModifierImplementation, { kind: TKind }>
>[] {
  const matches: ActiveCardImplementationModifier<
    Extract<CardModifierImplementation, { kind: TKind }>
  >[] = [];
  for (const sourceCardInstanceId of rezzedCorpRootCardIds(state)) {
    const sourceDefinition = cardDefinitionForInstance(
      state,
      sourceCardInstanceId,
    );
    const sourceImplementation = cardImplementationForDefinitionId(
      sourceDefinition.id,
    );
    for (const modifier of sourceImplementation?.modifiers ?? []) {
      if (modifier.kind !== kind) continue;
      matches.push({
        sourceCardInstanceId,
        sourceDefinitionId: sourceDefinition.id,
        sourceDefinition,
        modifier: modifier as Extract<
          CardModifierImplementation,
          { kind: TKind }
        >,
      });
    }
  }
  return matches;
}

/**
 * Returns active modifiers from currently rezzed Corp installed cards.
 *
 * This includes ICE and root cards. Callers still filter by modifier sourceZone
 * so root-only and installed-card modifiers do not accidentally overlap.
 */
export function activeCardImplementationModifiersForCorpInstalled<
  TKind extends CardModifierImplementation["kind"],
>(
  state: GameState,
  kind: TKind,
): ActiveCardImplementationModifier<
  Extract<CardModifierImplementation, { kind: TKind }>
>[] {
  const matches: ActiveCardImplementationModifier<
    Extract<CardModifierImplementation, { kind: TKind }>
  >[] = [];
  for (const sourceCardInstanceId of rezzedCorpInstalledCardIds(state)) {
    const sourceDefinition = cardDefinitionForInstance(
      state,
      sourceCardInstanceId,
    );
    const sourceImplementation = cardImplementationForDefinitionId(
      sourceDefinition.id,
    );
    for (const modifier of sourceImplementation?.modifiers ?? []) {
      if (modifier.kind !== kind) continue;
      matches.push({
        sourceCardInstanceId,
        sourceDefinitionId: sourceDefinition.id,
        sourceDefinition,
        modifier: modifier as Extract<
          CardModifierImplementation,
          { kind: TKind }
        >,
      });
    }
  }
  return matches;
}

/**
 * Returns active modifiers from installed Runner cards in deterministic order.
 */
export function activeCardImplementationModifiersForRunnerInstalled<
  TKind extends CardModifierImplementation["kind"],
>(
  state: GameState,
  kind: TKind,
): ActiveCardImplementationModifier<
  Extract<CardModifierImplementation, { kind: TKind }>
>[] {
  const matches: ActiveCardImplementationModifier<
    Extract<CardModifierImplementation, { kind: TKind }>
  >[] = [];
  for (const sourceCardInstanceId of runnerInstalledCardIds(state).sort()) {
    const sourceDefinition = cardDefinitionForInstance(
      state,
      sourceCardInstanceId,
    );
    const sourceImplementation = cardImplementationForDefinitionId(
      sourceDefinition.id,
    );
    for (const modifier of sourceImplementation?.modifiers ?? []) {
      if (modifier.kind !== kind) continue;
      matches.push({
        sourceCardInstanceId,
        sourceDefinitionId: sourceDefinition.id,
        sourceDefinition,
        modifier: modifier as Extract<
          CardModifierImplementation,
          { kind: TKind }
        >,
      });
    }
  }
  return matches;
}

/**
 * Returns active modifiers from the Corp score area.
 *
 * Scored-agenda modifiers are global unless their specific modifier kind later
 * applies additional filtering in its own query module.
 */
export function activeCardImplementationModifiersForScoredCorpAgendas<
  TKind extends CardModifierImplementation["kind"],
>(
  state: GameState,
  kind: TKind,
): ActiveCardImplementationModifier<
  Extract<CardModifierImplementation, { kind: TKind }>
>[] {
  const matches: ActiveCardImplementationModifier<
    Extract<CardModifierImplementation, { kind: TKind }>
  >[] = [];
  for (const sourceCardInstanceId of scoredCorpAgendaIds(state).sort()) {
    const sourceDefinition = cardDefinitionForInstance(
      state,
      sourceCardInstanceId,
    );
    const sourceImplementation = cardImplementationForDefinitionId(
      sourceDefinition.id,
    );
    for (const modifier of sourceImplementation?.modifiers ?? []) {
      if (modifier.kind !== kind) continue;
      matches.push({
        sourceCardInstanceId,
        sourceDefinitionId: sourceDefinition.id,
        sourceDefinition,
        modifier: modifier as Extract<
          CardModifierImplementation,
          { kind: TKind }
        >,
      });
    }
  }
  return matches;
}
