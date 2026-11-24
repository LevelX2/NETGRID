import type { CardInstanceId, GameState, LegalAction } from "@netgrid/shared";
import { visibleCorpCard } from "../view/card-view";
import type { PublicContextForActionDependencies } from "./public-context-dependencies";

export function applyPublicAdvancementCardProjection(
  state: GameState,
  legalAction: LegalAction,
  context: Record<string, unknown>,
  deps: PublicContextForActionDependencies,
): void {
  const payload = legalAction.payload;
  if (!payload) return;
  const operationAbility = payload.v1919OperationAbility;
  const fortRunWindowAbility = payload.fortRunWindowAbility;
  const placesAdvancementCounters =
    operationAbility === "add_advancement_counters" ||
    fortRunWindowAbility ===
      "add_advancement_counters_after_passing_last_ice_on_this_fort";
  const movesAdvancementCounters =
    operationAbility === "move_advancement_counters";
  if (!placesAdvancementCounters && !movesAdvancementCounters) return;

  if (movesAdvancementCounters) {
    delete context.advancementCounterSourceDefinitionId;
    delete context.advancementCounterTargetDefinitionId;

    const sourceCardId = stringValue(payload.advancementCounterSourceCardId);
    const targetCardId = stringValue(payload.advancementCounterTargetCardId);
    const sourceDefinitionId = sourceCardId
      ? publicInstalledCorpCardDefinitionId(state, sourceCardId, deps)
      : undefined;
    const targetDefinitionId = targetCardId
      ? publicInstalledCorpCardDefinitionId(state, targetCardId, deps)
      : undefined;
    context.advancementCounterSourceVisibility = sourceDefinitionId
      ? "public"
      : "hidden_installed_card";
    context.advancementCounterTargetVisibility = targetDefinitionId
      ? "public"
      : "hidden_installed_card";
    if (sourceDefinitionId)
      context.advancementCounterSourceDefinitionId = sourceDefinitionId;
    if (targetDefinitionId)
      context.advancementCounterTargetDefinitionId = targetDefinitionId;
    return;
  }

  delete context.targetCardId;
  delete context.targetCardDefinitionId;
  delete context.targetCardDefinitionIds;

  const targetIds = advancementTargetCardIds(payload);
  const targetCount = Math.max(
    targetIds.length,
    integerValue(payload.targetCount) ??
      (stringValue(payload.targetCardId) ? 1 : 0),
  );
  const publicDefinitionIds = targetIds
    .map((targetId) =>
      publicInstalledCorpCardDefinitionId(state, targetId, deps),
    )
    .filter(
      (definitionId): definitionId is number => definitionId !== undefined,
    );
  const hiddenTargetCount = Math.max(
    0,
    targetCount - publicDefinitionIds.length,
  );

  context.publicTargetCount = publicDefinitionIds.length;
  context.hiddenTargetCount = hiddenTargetCount;
  context.targetVisibility =
    hiddenTargetCount === 0
      ? "public"
      : publicDefinitionIds.length === 0
        ? "hidden_installed_card"
        : "mixed_public_and_hidden_installed_cards";
  if (publicDefinitionIds.length > 0)
    context.targetCardDefinitionIds = publicDefinitionIds.join(",");
  if (targetCount === 1 && publicDefinitionIds.length === 1)
    context.targetCardDefinitionId = publicDefinitionIds[0];
}

function advancementTargetCardIds(
  payload: NonNullable<LegalAction["payload"]>,
): CardInstanceId[] {
  const encodedTargetIds = stringValue(payload.advancementCounterTargetCardIds);
  if (encodedTargetIds)
    return encodedTargetIds
      .split(",")
      .map((targetId) => targetId.trim())
      .filter((targetId): targetId is CardInstanceId => targetId.length > 0);
  const targetCardId = stringValue(payload.targetCardId);
  return targetCardId ? [targetCardId as CardInstanceId] : [];
}

function publicInstalledCorpCardDefinitionId(
  state: GameState,
  cardId: string,
  deps: PublicContextForActionDependencies,
): number | undefined {
  const instance = state.cardInstances[cardId];
  if (!instance || instance.zone.side !== "corp") return undefined;
  const area =
    instance.zone.zone === "serverRoot"
      ? "root"
      : instance.zone.zone === "serverIce"
        ? "ice"
        : undefined;
  if (!area) return undefined;
  const visibleCard = visibleCorpCard(
    state,
    cardId as CardInstanceId,
    "runner",
    area,
  );
  return visibleCard.known
    ? deps.definitionFor(state, cardId as CardInstanceId).id
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function integerValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}
