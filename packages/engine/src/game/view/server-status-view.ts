import {
  type CardInstanceId,
  type GameState,
  type ServerId,
  type Side,
  type VisibleServerCostModifierStatus,
  type VisibleServerStatus,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  activeCardImplementationModifiersForRunnerInstalled,
  corpServerIdForInstalledCard,
  isPublicRezzedCorpRootModifier,
  isPublicRunnerInstalledModifier,
  type ActiveCardImplementationModifier,
} from "../../ability-engine/card-implementation-modifiers";
import type { CardInstallCostModifierImplementation } from "../../ability-engine/definition-modifier-contracts";
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
  ].sort((left, right) => left.id.localeCompare(right.id));
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
