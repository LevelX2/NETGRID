import deckSnapshots08Data from "../../../../data/decks/deck-snapshots-0.8.json";
import type { DeckSnapshotRecord } from "./benchmark-deck-types";

export const DECK_SNAPSHOTS_08 = (
  deckSnapshots08Data as { snapshots: DeckSnapshotRecord[] }
).snapshots;
