import { describe, expect, it } from "vitest";

import { deckReferenceLabel } from "./benchmark-deck-reference-label";
import type { AiBenchmarkDeckReference } from "./benchmark-deck-types";
import { listMatchProgressionBenchmarkDeckSlots } from "./benchmark-deck-slot-list";

describe("listMatchProgressionBenchmarkDeckSlots", () => {
  it("does not expose mutable nested references from the slot registry", () => {
    const first = listMatchProgressionBenchmarkDeckSlots();
    const slot = first[0];
    if (!slot) throw new Error("Expected at least one benchmark slot.");

    slot.runner.kind = "pending_real_scene";
    Object.assign(slot.runner, { label: "mutated" });

    expect(listMatchProgressionBenchmarkDeckSlots()[0]?.runner).not.toEqual(
      slot.runner,
    );
  });
});

const references: Array<[AiBenchmarkDeckReference, string]> = [
  [{ kind: "runtime_deck_id", deckId: "demo_runner_008" }, "demo_runner_008"],
  [{ kind: "snapshot", snapshotId: "runner-snapshot" }, "runner-snapshot"],
  [
    { kind: "frozen_local_snapshot", snapshotId: "runner-snapshot" },
    "runner-snapshot",
  ],
  [
    {
      kind: "local_editable_deck",
      localDeckId: "runner-local",
      expectedName: "Runner lokal",
      fileName: "runner.txt",
    },
    "Runner lokal (runner-local)",
  ],
  [
    { kind: "pending_real_scene", label: "Runner ausstehend" },
    "Runner ausstehend",
  ],
];

it.each(references)(
  "formats the benchmark deck reference %j",
  (reference, label) => {
    expect(deckReferenceLabel(reference)).toBe(label);
  },
);
