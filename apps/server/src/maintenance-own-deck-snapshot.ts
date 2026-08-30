import type { DeckSnapshot } from "@netgrid/decks";
import type { GameState, Side } from "@netgrid/shared";
import type { StoredMatch } from "./multiplayer";

const OWN_DECK_SNAPSHOT_SCHEMA_VERSION =
  "netgrid-maintenance-own-deck-snapshot-v1" as const;

export type StorageMaintenanceOwnDeckZoneBalance =
  | {
      provenance: "reconstructed";
      stateVersion: number;
      hiddenDeckCount: number;
      knownOutsideDeckTotal: number;
      knownOutsideDeckDefinitionCounts: Array<{
        definitionId: string;
        quantity: number;
      }>;
      remainingPossibleDefinitionCounts: Array<{
        definitionId: string;
        quantity: number;
      }>;
    }
  | {
      provenance: "unavailable";
      reason:
        | "historical_state_snapshot_not_persisted"
        | "historical_state_snapshot_mismatch";
    };

export type StorageMaintenanceOwnDeckSnapshot =
  | {
      schemaVersion: typeof OWN_DECK_SNAPSHOT_SCHEMA_VERSION;
      side: Side;
      provenance: "persisted";
      signature: string;
      deckSnapshotId: string;
      identityDefinitionId: string;
      definitionCounts: Array<{ definitionId: string; quantity: number }>;
      totalCards: number;
      cardPoolSnapshotId: string;
      cardPoolVersion?: string;
      formatProfileId: string;
      formatProfileVersion?: string;
      deckHash: string;
      zoneBalance?: StorageMaintenanceOwnDeckZoneBalance;
    }
  | {
      schemaVersion: typeof OWN_DECK_SNAPSHOT_SCHEMA_VERSION;
      side?: Side;
      provenance: "unavailable";
      reason:
        | "analysis_side_required"
        | "historical_deck_assignment_not_persisted"
        | "historical_deck_snapshot_not_persisted"
        | "historical_deck_snapshot_binding_mismatch";
    };

export function projectMaintenanceOwnDeckSnapshot(params: {
  match: Pick<StoredMatch["match"], "deckSetup">;
  privateDeckSnapshots?: StoredMatch["privateDeckSnapshots"];
  side?: Side;
  state?: GameState;
  includeZoneBalance?: boolean;
}): StorageMaintenanceOwnDeckSnapshot {
  if (!params.side) return unavailable("analysis_side_required");
  const assignment = params.match.deckSetup.assignment;
  if (!assignment)
    return unavailable("historical_deck_assignment_not_persisted", params.side);
  const player =
    params.side === "runner" ? assignment.runnerPlayer : assignment.corpPlayer;
  const snapshot =
    params.privateDeckSnapshots?.participants?.[player]?.[params.side];
  if (!snapshot)
    return unavailable("historical_deck_snapshot_not_persisted", params.side);
  if (
    !snapshotMatchesPersistedBinding(
      params.match.deckSetup,
      snapshot,
      params.side,
    )
  )
    return unavailable(
      "historical_deck_snapshot_binding_mismatch",
      params.side,
    );

  const definitionCounts = normalizedDefinitionCounts(snapshot);
  if (!definitionCounts)
    return unavailable(
      "historical_deck_snapshot_binding_mismatch",
      params.side,
    );
  const totalCards = definitionCounts.reduce(
    (total, entry) => total + entry.quantity,
    0,
  );
  const persisted: Extract<
    StorageMaintenanceOwnDeckSnapshot,
    { provenance: "persisted" }
  > = {
    schemaVersion: OWN_DECK_SNAPSHOT_SCHEMA_VERSION,
    side: params.side,
    provenance: "persisted",
    signature: `${params.side}:${snapshot.deckSnapshotId}:${snapshot.deckHash}`,
    deckSnapshotId: snapshot.deckSnapshotId,
    identityDefinitionId: snapshot.identityCardId,
    definitionCounts,
    totalCards,
    cardPoolSnapshotId: snapshot.cardPoolSnapshotId,
    ...(snapshot.cardPoolVersion
      ? { cardPoolVersion: snapshot.cardPoolVersion }
      : {}),
    formatProfileId: snapshot.formatProfileId,
    ...(snapshot.formatProfileVersion
      ? { formatProfileVersion: snapshot.formatProfileVersion }
      : {}),
    deckHash: snapshot.deckHash,
  };
  return params.includeZoneBalance
    ? {
        ...persisted,
        zoneBalance: params.state
          ? reconstructOwnDeckZoneBalance(
              params.state,
              params.side,
              definitionCounts,
            )
          : {
              provenance: "unavailable" as const,
              reason: "historical_state_snapshot_not_persisted" as const,
            },
      }
    : persisted;
}

function unavailable(
  reason: Extract<
    StorageMaintenanceOwnDeckSnapshot,
    { provenance: "unavailable" }
  >["reason"],
  side?: Side,
): StorageMaintenanceOwnDeckSnapshot {
  return {
    schemaVersion: OWN_DECK_SNAPSHOT_SCHEMA_VERSION,
    ...(side ? { side } : {}),
    provenance: "unavailable",
    reason,
  };
}

function snapshotMatchesPersistedBinding(
  deckSetup: StoredMatch["match"]["deckSetup"],
  snapshot: DeckSnapshot,
  expectedSide: Side,
): boolean {
  const side = snapshot.side;
  const expectedSnapshotId =
    side === "runner" ? deckSetup.runnerSnapshotId : deckSetup.corpSnapshotId;
  const expectedMetadata =
    side === "runner" ? deckSetup.runner : deckSetup.corp;
  return (
    side === expectedSide &&
    snapshot.immutable === true &&
    snapshot.deckSnapshotId === expectedSnapshotId &&
    snapshot.identityCardId === expectedMetadata.identityCardId &&
    snapshot.cardPoolSnapshotId === expectedMetadata.cardPoolSnapshotId &&
    snapshot.cardPoolVersion === expectedMetadata.cardPoolVersion &&
    snapshot.formatProfileId === expectedMetadata.formatProfileId &&
    snapshot.formatProfileVersion === expectedMetadata.formatProfileVersion &&
    snapshot.deckHash === expectedMetadata.deckHash &&
    snapshot.publicMetadata.side === side &&
    snapshot.publicMetadata.deckHash === snapshot.deckHash
  );
}

function normalizedDefinitionCounts(
  snapshot: DeckSnapshot,
): Array<{ definitionId: string; quantity: number }> | undefined {
  const counts = new Map<string, number>();
  for (const entry of snapshot.cards) {
    if (
      typeof entry.cardId !== "string" ||
      entry.cardId.length === 0 ||
      !Number.isInteger(entry.quantity) ||
      entry.quantity <= 0 ||
      counts.has(entry.cardId)
    )
      return undefined;
    counts.set(entry.cardId, entry.quantity);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([definitionId, quantity]) => ({ definitionId, quantity }));
}

function reconstructOwnDeckZoneBalance(
  state: GameState,
  side: Side,
  definitionCounts: Array<{ definitionId: string; quantity: number }>,
): StorageMaintenanceOwnDeckZoneBalance {
  const hiddenDeckCount =
    side === "runner" ? state.runner.stack.length : state.corp.rd.length;
  const identityInstanceId =
    side === "runner" ? state.runner.identity : state.corp.identity;
  const available = new Map(
    definitionCounts.map((entry) => [entry.definitionId, entry.quantity]),
  );
  const knownOutside = new Map<string, number>();
  for (const card of Object.values(state.cardInstances)) {
    if (
      card.owner !== side ||
      card.instanceId === identityInstanceId ||
      isOwnHiddenDeckZone(card.zone, side) ||
      !available.has(card.definitionId)
    )
      continue;
    knownOutside.set(
      card.definitionId,
      (knownOutside.get(card.definitionId) ?? 0) + 1,
    );
  }
  const knownOutsideDeckDefinitionCounts = definitionCounts.flatMap((entry) => {
    const quantity = Math.min(
      entry.quantity,
      knownOutside.get(entry.definitionId) ?? 0,
    );
    return quantity > 0 ? [{ definitionId: entry.definitionId, quantity }] : [];
  });
  const remainingPossibleDefinitionCounts = definitionCounts.flatMap(
    (entry) => {
      const quantity = Math.max(
        0,
        entry.quantity - (knownOutside.get(entry.definitionId) ?? 0),
      );
      return quantity > 0
        ? [{ definitionId: entry.definitionId, quantity }]
        : [];
    },
  );
  const knownOutsideDeckTotal = knownOutsideDeckDefinitionCounts.reduce(
    (total, entry) => total + entry.quantity,
    0,
  );
  const remainingTotal = remainingPossibleDefinitionCounts.reduce(
    (total, entry) => total + entry.quantity,
    0,
  );
  if (remainingTotal !== hiddenDeckCount)
    return {
      provenance: "unavailable",
      reason: "historical_state_snapshot_mismatch",
    };
  return {
    provenance: "reconstructed",
    stateVersion: state.stateVersion,
    hiddenDeckCount,
    knownOutsideDeckTotal,
    knownOutsideDeckDefinitionCounts,
    remainingPossibleDefinitionCounts,
  };
}

function isOwnHiddenDeckZone(
  zone: GameState["cardInstances"][string]["zone"],
  side: Side,
): boolean {
  return (
    (side === "runner" && zone.side === "runner" && zone.zone === "stack") ||
    (side === "corp" && zone.side === "corp" && zone.zone === "rd")
  );
}
