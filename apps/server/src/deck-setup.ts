import cardSnapshotData from "../../../data/card-import/card-snapshot-0.8.json";
import profilesData from "../../../data/decks/deck-format-profiles-0.8.json";
import snapshotsData from "../../../data/decks/deck-snapshots-0.8.json";
import { buildEngineDeck, validateDeckSnapshot, type DeckFormatProfile, type DeckSnapshot, type DeckValidationContext } from "@netrunner/decks";

export type MatchDeckSelectionInput = {
  runnerDeckSnapshotId?: string;
  corpDeckSnapshotId?: string;
  runnerDeckSnapshot?: DeckSnapshot;
  corpDeckSnapshot?: DeckSnapshot;
};

export type ResolvedDeckSetup = {
  runnerSnapshot: DeckSnapshot;
  corpSnapshot: DeckSnapshot;
  runnerDeck: ReturnType<typeof buildEngineDeck>;
  corpDeck: ReturnType<typeof buildEngineDeck>;
};

const DEFAULT_RUNNER_SNAPSHOT_ID = "demo_runner_008_snapshot_v0_8";
const DEFAULT_CORP_SNAPSHOT_ID = "demo_corp_008_snapshot_v0_8";
const cardsById = Object.fromEntries((cardSnapshotData.cards as DeckValidationContext["cardsById"][string][]).map((card) => [card.catalogCardId, card]));
const profiles = profilesData.profiles as DeckFormatProfile[];
const frozenSnapshots = snapshotsData.snapshots as DeckSnapshot[];

export function resolveDeckSetup(input: MatchDeckSelectionInput = {}): ResolvedDeckSetup {
  const runnerSnapshot = resolveSnapshot("runner", input.runnerDeckSnapshot, input.runnerDeckSnapshotId, DEFAULT_RUNNER_SNAPSHOT_ID);
  const corpSnapshot = resolveSnapshot("corp", input.corpDeckSnapshot, input.corpDeckSnapshotId, DEFAULT_CORP_SNAPSHOT_ID);
  return {
    runnerSnapshot,
    corpSnapshot,
    runnerDeck: buildEngineDeck(runnerSnapshot),
    corpDeck: buildEngineDeck(corpSnapshot)
  };
}

export function setupUsesExpandedRules(setup: ResolvedDeckSetup): boolean {
  return setupUsesMvp08Rules(setup) || setup.runnerSnapshot.rulesBaselineId === "rules-baseline-mvp-0.4" || setup.corpSnapshot.rulesBaselineId === "rules-baseline-mvp-0.4";
}

export function setupUsesMvp08Rules(setup: ResolvedDeckSetup): boolean {
  return (
    setup.runnerSnapshot.rulesBaselineId === "rules-baseline-mvp-0.8" ||
    setup.corpSnapshot.rulesBaselineId === "rules-baseline-mvp-0.8"
  );
}

export function defaultAgendaPointsToWin(setup: ResolvedDeckSetup): number {
  return setup.corpSnapshot.validation.agendaPoints ?? (setupUsesExpandedRules(setup) ? 7 : 6);
}

function resolveSnapshot(side: "runner" | "corp", supplied: DeckSnapshot | undefined, requestedId: string | undefined, fallbackId: string): DeckSnapshot {
  const snapshot = supplied ?? frozenSnapshots.find((candidate) => candidate.deckSnapshotId === (requestedId || fallbackId));
  if (!snapshot) throw new Error("deck_snapshot_not_found");
  if (snapshot.side !== side) throw new Error("deck_snapshot_wrong_side");
  if (!snapshot.validation.ok) throw new Error("deck_snapshot_not_validated");
  const profile = profiles.find((candidate) => candidate.profileId === snapshot.formatProfileId);
  if (!profile) throw new Error("deck_format_profile_not_found");
  const validation = validateDeckSnapshot(snapshot, { cardsById, profile });
  if (!validation.ok) throw new Error("deck_snapshot_invalid");
  return structuredClone(snapshot) as DeckSnapshot;
}
