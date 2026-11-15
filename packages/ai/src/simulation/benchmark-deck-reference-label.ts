import type { AiBenchmarkDeckReference } from "./benchmark-deck-types";

export function deckReferenceLabel(
  reference: AiBenchmarkDeckReference,
): string {
  switch (reference.kind) {
    case "runtime_deck_id":
      return reference.deckId;
    case "snapshot":
    case "frozen_local_snapshot":
      return reference.snapshotId;
    case "local_editable_deck":
      return `${reference.expectedName} (${reference.localDeckId})`;
    case "pending_real_scene":
      return reference.label;
  }
}
