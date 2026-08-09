import {
  CARD_DEFINITIONS_BY_ID,
  type CardInstanceId,
  type GameState,
  type ServerId,
  type Side,
  type VisibleServerCostModifierStatus,
  type VisibleServerStatus,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  activeCardImplementationModifiersForCorpRoot,
  activeCardImplementationModifiersForRunnerInstalled,
  corpServerIdForInstalledCard,
  isPublicRezzedCorpRootModifier,
  isPublicRunnerInstalledModifier,
  type ActiveCardImplementationModifier,
} from "../../ability-engine/card-implementation-modifiers";
import type { CardInstallCostModifierImplementation } from "@netgrid/cards/engine";
import { serverRunStartRestrictions } from "../run/server-run-start-restrictions";

type ActiveInstallCostModifier =
  ActiveCardImplementationModifier<CardInstallCostModifierImplementation>;

export function visibleServerStatuses(
  state: GameState,
  targetServerId: Exclude<ServerId, "new_remote">,
): VisibleServerStatus[] {
  return [
    ...serverRunStartRestrictions(state, targetServerId),
    ...visibleServerIceInstallCostModifierStatuses(state, targetServerId),
    ...visibleStealthPaymentRestrictionStatuses(state, targetServerId),
    ...visibleDuringRunIceRezSupportStatuses(state, targetServerId),
  ].sort((left, right) => left.id.localeCompare(right.id));
}

function visibleDuringRunIceRezSupportStatuses(
  state: GameState,
  targetServerId: Exclude<ServerId, "new_remote">,
): VisibleServerStatus[] {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  if (!server) throw new Error(`Server fehlt: ${targetServerId}`);
  return server.root.flatMap((cardId) => {
    const instance = state.cardInstances[cardId];
    if (!instance?.rezzed) return [];
    const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
    if (!definition)
      throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
    const support = cardImplementationForDefinitionId(
      definition.id,
    )?.fortRunWindows?.find(
      (window) =>
        window.kind === "discounted_rez_ice_on_this_fort" &&
        window.timing === "during_run_on_this_fort" &&
        window.discount === "half_rez_cost_rounded_down" &&
        window.target === "unrezzed_ice_on_this_fort" &&
        window.limit === "once_per_run_per_source" &&
        window.visibility === "public",
    );
    if (!support) return [];
    return [
      {
        id: `server_status:${targetServerId}:during_run_ice_rez_support:${cardId}`,
        kind: "during_run_ice_rez_support" as const,
        scope: "target_server" as const,
        costModel: "half_rez_cost_rounded_down" as const,
        target: "unrezzed_ice_on_this_fort" as const,
        limit: "once_per_run_per_source" as const,
        targetServerId,
        sourceCardInstanceId: cardId,
        sourceTitle: definition.title,
        sourceSide: "corp" as const,
      },
    ];
  });
}

function visibleStealthPaymentRestrictionStatuses(
  state: GameState,
  targetServerId: Exclude<ServerId, "new_remote">,
): VisibleServerStatus[] {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  if (!server) throw new Error(`Server fehlt: ${targetServerId}`);
  return server.root.flatMap((cardId) => {
    const instance = state.cardInstances[cardId];
    if (!instance?.rezzed) return [];
    const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
    if (!definition)
      throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
    const implementation = cardImplementationForDefinitionId(definition.id);
    if (
      !implementation?.fortRunWindows?.some(
        (window) =>
          window.kind === "block_stealth_bits_during_runs_on_this_fort",
      )
    )
      return [];
    return [
      {
        id: `server_status:${targetServerId}:run_payment_restriction:${cardId}:stealth_bits`,
        kind: "run_payment_restriction" as const,
        scope: "target_server" as const,
        restriction: "runner_stealth_bit_payment_sources" as const,
        targetServerId,
        sourceCardInstanceId: cardId,
        sourceTitle: definition.title,
        sourceSide: "corp" as const,
      },
    ];
  });
}

function visibleServerIceInstallCostModifierStatuses(
  state: GameState,
  targetServerId: Exclude<ServerId, "new_remote">,
): VisibleServerCostModifierStatus[] {
  const statuses: VisibleServerCostModifierStatus[] = [];
  appendCorpRootStatuses(
    statuses,
    state,
    targetServerId,
    activeCardImplementationModifiersForCorpRoot(state, "install_cost"),
  );
  appendRunnerInstalledStatuses(
    statuses,
    state,
    targetServerId,
    activeCardImplementationModifiersForRunnerInstalled(state, "install_cost"),
  );
  return statuses;
}

function appendCorpRootStatuses(
  statuses: VisibleServerCostModifierStatus[],
  state: GameState,
  targetServerId: Exclude<ServerId, "new_remote">,
  activeModifiers: ActiveInstallCostModifier[],
): void {
  for (const [index, active] of activeModifiers.entries()) {
    const modifier = active.modifier;
    if (
      !isPublicRezzedCorpRootModifier(modifier) ||
      !validStatusAmount(modifier.amount) ||
      modifier.appliesTo.side !== "corp" ||
      modifier.appliesTo.cardType !== "ice" ||
      modifier.appliesTo.sameServerAsSource !== true ||
      corpServerIdForInstalledCard(state, active.sourceCardInstanceId) !==
        targetServerId
    )
      continue;
    statuses.push(costModifierStatus(active, targetServerId, "corp", index));
  }
}

function appendRunnerInstalledStatuses(
  statuses: VisibleServerCostModifierStatus[],
  state: GameState,
  targetServerId: Exclude<ServerId, "new_remote">,
  activeModifiers: ActiveInstallCostModifier[],
): void {
  for (const [index, active] of activeModifiers.entries()) {
    const modifier = active.modifier;
    const source = state.cardInstances[active.sourceCardInstanceId];
    if (
      !source ||
      source.faceup !== true ||
      !isPublicRunnerInstalledModifier(modifier) ||
      !validStatusAmount(modifier.amount) ||
      modifier.appliesTo.side !== "corp" ||
      modifier.appliesTo.cardType !== "ice" ||
      modifier.appliesTo.selectedServerAsSource !== true ||
      source.selectedServerId !== targetServerId
    )
      continue;
    statuses.push(costModifierStatus(active, targetServerId, "runner", index));
  }
}

function costModifierStatus(
  active: ActiveInstallCostModifier,
  targetServerId: Exclude<ServerId, "new_remote">,
  sourceSide: Side,
  index: number,
): VisibleServerCostModifierStatus {
  return {
    id: serverCostModifierStatusId(
      targetServerId,
      active.modifier.operation,
      active.sourceCardInstanceId,
      index,
    ),
    kind: "cost_modifier",
    scope: "target_server",
    costKind: "corp_ice_install",
    operation: active.modifier.operation,
    amount: active.modifier.amount,
    targetServerId,
    sourceCardInstanceId: active.sourceCardInstanceId,
    sourceTitle: active.sourceDefinition.title,
    sourceSide,
  };
}

function serverCostModifierStatusId(
  targetServerId: Exclude<ServerId, "new_remote">,
  operation: VisibleServerCostModifierStatus["operation"],
  sourceCardInstanceId: CardInstanceId,
  index: number,
): string {
  return `server_status:${targetServerId}:corp_ice_install:${operation}:${sourceCardInstanceId}:${index}`;
}

function validStatusAmount(amount: number): boolean {
  return Number.isFinite(amount) && Number.isInteger(amount) && amount > 0;
}
