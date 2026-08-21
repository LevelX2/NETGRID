import { describe, expect, it } from "vitest";

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
