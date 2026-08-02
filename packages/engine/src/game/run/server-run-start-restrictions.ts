import {
  CARD_DEFINITIONS_BY_ID,
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
      });
    }
  }
  return sources.sort((left, right) =>
    `${left.sourceCardInstanceId}:${left.implementation.abilityKey}`.localeCompare(
      `${right.sourceCardInstanceId}:${right.implementation.abilityKey}`,
    ),
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
    .map(({ sourceCardInstanceId, sourceTitle, implementation }) => ({
      id: `server_status:${targetServerId}:run_prohibited:${sourceCardInstanceId}:${implementation.abilityKey}`,
      kind: "run_prohibited",
      scope: "target_server",
      reason: "required_corp_activity_during_latest_corp_turn_missing",
      targetServerId,
      sourceCardInstanceId,
      sourceAbilityId: implementation.abilityKey,
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
