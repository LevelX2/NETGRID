import type {
  AccessStealCostModifierSnapshot,
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  cardDefinitionForInstance,
  cardMatchesModifierAppliesTo,
  corpServerIdForInstalledCard,
  isPublicRezzedCorpRootModifier,
} from "./card-implementation-modifiers";
import type { CardStealCostModifierImplementation } from "./definition-types";

export type StealCostModifierQuote = {
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId: CardDefinition["id"];
  sourceTitle: string;
  amount: number;
  persistedForCurrentAccess: boolean;
};

export type StealCostQuote = {
  totalCost: number;
  modifiers: StealCostModifierQuote[];
  publicPayload: NonNullable<LegalAction["payload"]>;
};

function stealCostModifierAppliesToAgenda(
  state: GameState,
  modifier: CardStealCostModifierImplementation,
  sourceCardInstanceId: CardInstanceId,
  serverId: Exclude<ServerId, "new_remote">,
  agendaDefinition: CardDefinition,
): boolean {
  if (
    modifier.operation !== "increase" ||
    modifier.side !== "corp" ||
    !isPublicRezzedCorpRootModifier(modifier)
  )
    return false;
  if (!cardMatchesModifierAppliesTo(agendaDefinition, modifier.appliesTo))
    return false;
  if (!modifier.sameServerAsSource) return true;
  return corpServerIdForInstalledCard(state, sourceCardInstanceId) === serverId;
}

function activeStealCostModifiersForAgenda(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  agendaDefinition: CardDefinition,
): StealCostModifierQuote[] {
  const matches: StealCostModifierQuote[] = [];
  for (const match of activeCardImplementationModifiersForCorpRoot(
    state,
    "steal_cost",
  )) {
    if (
      !stealCostModifierAppliesToAgenda(
        state,
        match.modifier,
        match.sourceCardInstanceId,
        serverId,
        agendaDefinition,
      )
    )
      continue;
    matches.push({
      sourceCardInstanceId: match.sourceCardInstanceId,
      sourceDefinitionId: match.sourceDefinitionId,
      sourceTitle: match.sourceDefinition.title,
      amount: match.modifier.amount,
      persistedForCurrentAccess: false,
    });
  }
  return matches;
}

function persistedStealCostModifiersForAgenda(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  agendaDefinition: CardDefinition,
  activeSourceIds: Set<CardInstanceId>,
): StealCostModifierQuote[] {
  const snapshots =
    state.run?.accessStealCostModifierSnapshotsByServer?.[serverId] ?? [];
  return snapshots
    .filter(
      (snapshot) =>
        !activeSourceIds.has(snapshot.sourceCardInstanceId) &&
        snapshot.visibility === "public" &&
        agendaDefinition.type === snapshot.appliesToCardType,
    )
    .map((snapshot) => ({
      sourceCardInstanceId: snapshot.sourceCardInstanceId,
      sourceDefinitionId: snapshot.sourceDefinitionId,
      sourceTitle: snapshot.sourceTitle,
      amount: snapshot.amount,
      persistedForCurrentAccess: true,
    }));
}

export function quoteStealCostForAccessedAgenda(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  agendaDefinition: CardDefinition,
): StealCostQuote {
  if (agendaDefinition.type !== "agenda") {
    return { totalCost: 0, modifiers: [], publicPayload: {} };
  }
  const active = activeStealCostModifiersForAgenda(
    state,
    serverId,
    agendaDefinition,
  );
  const activeSourceIds = new Set(
    active.flatMap((modifier) =>
      modifier.sourceCardInstanceId ? [modifier.sourceCardInstanceId] : [],
    ),
  );
  const persisted = persistedStealCostModifiersForAgenda(
    state,
    serverId,
    agendaDefinition,
    activeSourceIds,
  );
  const modifiers = [...active, ...persisted].sort((a, b) =>
    `${a.sourceDefinitionId}:${a.sourceCardInstanceId ?? ""}`.localeCompare(
      `${b.sourceDefinitionId}:${b.sourceCardInstanceId ?? ""}`,
    ),
  );
  const totalCost = modifiers.reduce((sum, modifier) => sum + modifier.amount, 0);
  const publicPayload: NonNullable<LegalAction["payload"]> = {};
  if (totalCost > 0) {
    publicPayload.stealCost = totalCost;
    publicPayload.stealAdditionalCost = totalCost;
    publicPayload.stealCostSourceDefinitionIds = modifiers
      .map((modifier) => modifier.sourceDefinitionId)
      .join(",");
    publicPayload.stealCostSourceTitles = modifiers
      .map((modifier) => modifier.sourceTitle)
      .join(",");
    if (modifiers.some((modifier) => modifier.persistedForCurrentAccess))
      publicPayload.stealCostPersistedForCurrentAccess = true;
  }
  return { totalCost, modifiers, publicPayload };
}

function snapshotForModifier(
  sourceCardInstanceId: CardInstanceId,
  sourceDefinition: CardDefinition,
  modifier: CardStealCostModifierImplementation,
): AccessStealCostModifierSnapshot {
  return {
    sourceCardInstanceId,
    sourceDefinitionId: sourceDefinition.id,
    sourceTitle: sourceDefinition.title,
    amount: modifier.amount,
    appliesToCardType: modifier.appliesTo.cardType,
    visibility: modifier.visibility,
  };
}

export function snapshotPersistentStealCostModifiersForSource(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
  serverId: Exclude<ServerId, "new_remote">,
  legalAction?: LegalAction,
): void {
  const run = state.run;
  if (!run) return;
  if (corpServerIdForInstalledCard(state, sourceCardInstanceId) !== serverId)
    return;
  const sourceDefinition = cardDefinitionForInstance(state, sourceCardInstanceId);
  const sourceImplementation = activeCardImplementationModifiersForCorpRoot(
    state,
    "steal_cost",
  ).filter((match) => match.sourceCardInstanceId === sourceCardInstanceId);
  const snapshots = sourceImplementation
    .filter(
      (match) =>
        match.modifier.persistsForCurrentAccessIfSourceTrashed &&
        match.modifier.sameServerAsSource === true,
    )
    .map((match) =>
      snapshotForModifier(sourceCardInstanceId, sourceDefinition, match.modifier),
    );
  if (snapshots.length === 0) return;
  const existing =
    run.accessStealCostModifierSnapshotsByServer?.[serverId] ?? [];
  const next = [...existing];
  for (const snapshot of snapshots) {
    const duplicate = next.some(
      (candidate) =>
        candidate.sourceCardInstanceId === snapshot.sourceCardInstanceId &&
        candidate.sourceDefinitionId === snapshot.sourceDefinitionId,
    );
    if (!duplicate) next.push(snapshot);
  }
  run.accessStealCostModifierSnapshotsByServer = {
    ...(run.accessStealCostModifierSnapshotsByServer ?? {}),
    [serverId]: next,
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      stealCostPersistedForCurrentAccess: true,
      stealCostSourceDefinitionIds: next
        .map((snapshot) => snapshot.sourceDefinitionId)
        .join(","),
      stealCostSourceTitles: next
        .map((snapshot) => snapshot.sourceTitle)
        .join(","),
    };
  }
}
