import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import {
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type ServerId,
  type VisibleServerRunProhibitedStatus,
} from "@netgrid/shared";
import type { CardFortRunWindowImplementation } from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  corpInstalledCardIds,
  scoredCorpAgendaIds,
} from "../state/card-server-lookup";
import { ensureCorpTurnFlags } from "../state/turn-flags-counters";

type ServerRunStartRestrictionImplementation = Extract<
  CardFortRunWindowImplementation,
  { kind: "server_run_start_restriction" }
>;

export type ServerRunStartRestrictionSource = {
  sourceCardInstanceId: CardInstanceId;
  sourceTitle: string;
  targetServerId: Exclude<ServerId, "new_remote">;
  implementation: ServerRunStartRestrictionImplementation;
  sourceCapabilityKey: string;
};

export function serverRunStartRestrictionSources(
  state: GameState,
  targetServerId: Exclude<ServerId, "new_remote">,
): ServerRunStartRestrictionSource[] {
  const sources: ServerRunStartRestrictionSource[] = [];
  for (const sourceCardInstanceId of activeCorpCardIds(state)) {
    const instance = state.cardInstances[sourceCardInstanceId];
    if (!instance) continue;
    const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
    if (!definition) continue;
    const implementation = cardImplementationForDefinitionId(definition.id);
    for (const window of implementation?.fortRunWindows ?? []) {
      if (window.kind !== "server_run_start_restriction") continue;
      const resolvedTargetServerId = resolveRunStartRestrictionTargetServerId(
        instance,
        window.target,
      );
      if (resolvedTargetServerId !== targetServerId) continue;
      sources.push({
        sourceCardInstanceId,
        sourceTitle: definition.title,
        targetServerId,
        implementation: window,
        sourceCapabilityKey: runStartRestrictionCapabilityKey(
          definition.id,
          window,
        ),
      });
    }
  }
  return sources.sort((left, right) =>
    `${left.sourceCardInstanceId}:${left.sourceCapabilityKey}`.localeCompare(
      `${right.sourceCardInstanceId}:${right.sourceCapabilityKey}`,
    ),
  );
}

export function runStartRestrictionCapabilityKey(
  definitionId: string,
  implementation: ServerRunStartRestrictionImplementation,
): string {
  const capabilityKey =
    "capabilityKey" in implementation
      ? implementation.capabilityKey
      : undefined;
  const abilityKey =
    "abilityKey" in implementation ? implementation.abilityKey : undefined;
  if (capabilityKey !== undefined && abilityKey === undefined)
    return capabilityKey;
  if (abilityKey !== undefined && capabilityKey === undefined)
    return abilityKey;
  if (capabilityKey !== undefined)
    throw new Error(
      `hybrid_run_restriction_capability_identity: ${definitionId}`,
    );
  if ("capabilityKey" in implementation)
    throw new Error(
      `card_spec_run_restriction_capability_key_missing: ${definitionId}`,
    );
  if ("abilityKey" in implementation)
    throw new Error(
      `legacy_run_restriction_ability_key_missing: ${definitionId}`,
    );
  throw new Error(
    `run_restriction_capability_identity_missing: ${definitionId}`,
  );
}

export function serverRunStartRestrictions(
  state: GameState,
  targetServerId: Exclude<ServerId, "new_remote">,
): VisibleServerRunProhibitedStatus[] {
  return serverRunStartRestrictionSources(state, targetServerId)
    .filter(
      ({ implementation }) =>
        implementation.condition ===
          "corp_installed_or_advanced_on_target_server_during_latest_corp_turn" &&
        !hasFortActivitySinceCorpTurnStart(state, targetServerId),
    )
    .map(({ sourceCardInstanceId, sourceTitle, sourceCapabilityKey }) => ({
      id: `server_status:${targetServerId}:run_prohibited:${sourceCardInstanceId}:${sourceCapabilityKey}`,
      kind: "run_prohibited",
      scope: "target_server",
      reason: "required_corp_activity_during_latest_corp_turn_missing",
      targetServerId,
      sourceCardInstanceId,
      sourceAbilityId: sourceCapabilityKey,
      sourceTitle,
      sourceSide: "corp",
    }));
}

export function hasFortActivitySinceCorpTurnStart(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): boolean {
  return (
    state.corpTurnFlags?.fortActivityServerIdsSinceCorpTurnStart?.includes(
      serverId,
    ) === true
  );
}

export function markFortActivitySinceCorpTurnStart(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): void {
  const flags = ensureCorpTurnFlags(state);
  flags.fortActivityServerIdsSinceCorpTurnStart = [
    ...new Set([
      ...(flags.fortActivityServerIdsSinceCorpTurnStart ?? []),
      serverId,
    ]),
  ].sort();
}

export function clearFortActivitySinceCorpTurnStart(state: GameState): void {
  ensureCorpTurnFlags(state).fortActivityServerIdsSinceCorpTurnStart = [];
}

export function resolveRunStartRestrictionTargetServerId(
  instance: CardInstance,
  target: ServerRunStartRestrictionImplementation["target"],
): Exclude<ServerId, "new_remote"> | undefined {
  if (target === "selected_server") return instance.selectedServerId;
  if (
    instance.zone.side === "corp" &&
    (instance.zone.zone === "serverRoot" || instance.zone.zone === "serverIce")
  )
    return instance.zone.serverId;
  return undefined;
}

function activeCorpCardIds(state: GameState): CardInstanceId[] {
  return [
    state.corp.identity,
    ...scoredCorpAgendaIds(state),
    ...corpInstalledCardIds(state).filter(
      (cardId) => state.cardInstances[cardId]?.rezzed === true,
    ),
  ]
    .filter((cardId, index, values) => values.indexOf(cardId) === index)
    .sort();
}
