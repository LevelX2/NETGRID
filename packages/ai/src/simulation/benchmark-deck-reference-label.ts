type BenchmarkDeckReferenceLabelInput =
  | { readonly kind: "runtime_deck_id"; readonly deckId: string }
  | { readonly kind: "snapshot"; readonly snapshotId: string }
  | { readonly kind: "frozen_local_snapshot"; readonly snapshotId: string }
  | {
      readonly kind: "local_editable_deck";
      readonly localDeckId: string;
      readonly expectedName: string;
    }
  | { readonly kind: "pending_real_scene"; readonly label: string };

export function deckReferenceLabel(
  reference: BenchmarkDeckReferenceLabelInput,
): string {
  switch (reference.kind) {
    case "runtime_deck_id":
      return reference.deckId;
    case "snapshot":
      return reference.snapshotId;
    case "frozen_local_snapshot":
      return reference.snapshotId;
    case "local_editable_deck":
      return `${reference.expectedName} (${reference.localDeckId})`;
    case "pending_real_scene":
      return reference.label;
  }
}
