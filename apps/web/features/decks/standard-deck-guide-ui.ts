import type {
  StandardDeckGuideEntry,
  StandardDeckGuideStatus,
} from "@netgrid/decks";

export type DeckSlotSnapshot = {
  deckSnapshotId: string;
  sourceDeckId?: string;
  name: string;
  guideStatus?: StandardDeckGuideStatus;
  guide?: StandardDeckGuideEntry;
};

export type StandardDeckGuideControlState = {
  label: string;
  disabled: boolean;
  status: StandardDeckGuideStatus;
  guide?: StandardDeckGuideEntry;
};

export function standardDeckGuideControlState(input: {
  source: "snapshot" | "local" | "random_standard";
  snapshot?: DeckSlotSnapshot;
}): StandardDeckGuideControlState | null {
  if (input.source !== "snapshot" || !input.snapshot) return null;
  if (input.snapshot.guideStatus === "available" && input.snapshot.guide) {
    return {
      label: "Deck-Anleitung",
      disabled: false,
      status: "available",
      guide: input.snapshot.guide,
    };
  }
  if (
    input.snapshot.guideStatus === "stale" ||
    input.snapshot.guideStatus === "invalid"
  ) {
    return {
      label: "Anleitung muss aktualisiert werden",
      disabled: true,
      status: input.snapshot.guideStatus,
    };
  }
  return {
    label: "Anleitung fehlt noch",
    disabled: true,
    status: "missing",
  };
}

export function attachStandardDeckGuides<
  TSnapshot extends {
    deckSnapshotId: string;
    sourceDeckId: string;
    name: string;
  },
  TStandard extends {
    standardDeckId: string;
    guideStatus?: StandardDeckGuideStatus;
    guide?: StandardDeckGuideEntry;
  },
>(snapshots: TSnapshot[], standards: TStandard[]): DeckSlotSnapshot[] {
  const standardsById = new Map(
    standards.map((standard) => [standard.standardDeckId, standard]),
  );
  return snapshots.map((snapshot) => {
    const standard = standardsById.get(snapshot.sourceDeckId);
    return {
      deckSnapshotId: snapshot.deckSnapshotId,
      sourceDeckId: snapshot.sourceDeckId,
      name: snapshot.name,
      guideStatus: standard?.guideStatus ?? "missing",
      ...(standard?.guide ? { guide: standard.guide } : {}),
    };
  });
}
