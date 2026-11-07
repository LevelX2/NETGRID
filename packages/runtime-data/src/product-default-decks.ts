import catalog from "../../../data/decks/standard-deck-catalog-1.0.0.json" with { type: "json" };

function activeDefaultSnapshotId(
  standardDeckId: string,
  side: "runner" | "corp",
): string {
  const matching = catalog.decks.filter(
    (deck) =>
      deck.standardDeckId === standardDeckId && deck.status === "active",
  );
  const [deck] = matching;
  if (matching.length !== 1 || !deck || deck.side !== side || !deck.version) {
    throw new Error(
      `product_default_standard_deck_invalid:${side}:${standardDeckId}`,
    );
  }
  return `standard_${deck.standardDeckId}_${deck.version}`;
}

export const PRODUCT_DEFAULT_RUNNER_SNAPSHOT_ID = activeDefaultSnapshotId(
  "standard_runner_bit_denial_lock",
  "runner",
);

export const PRODUCT_DEFAULT_CORP_SNAPSHOT_ID = activeDefaultSnapshotId(
  "standard_corp_cheap_bag_tricks",
  "corp",
);
