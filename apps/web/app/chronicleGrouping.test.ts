import { describe, expect, it } from "vitest";

import { groupChronicleEntriesForRender, type ChronicleGroupableEntry } from "./chronicleGrouping";

function entry(
  id: string,
  groupLabel: string,
  groupKind: ChronicleGroupableEntry["groupKind"],
  groupInstanceKey?: string,
): ChronicleGroupableEntry {
  return {
    groupLabel,
    groupKind,
    turnGroupLabel: "Zug 2 - Runner",
    ...(groupInstanceKey ? { groupInstanceKey } : {}),
    item: { id },
  };
}

describe("groupChronicleEntriesForRender", () => {
  it("keeps consecutive runs on the same target as separate render groups", () => {
    const groups = groupChronicleEntriesForRender([
      entry("evt_run_2_end", "Run auf HQ", "run", "run:evt_run_2_start"),
      entry("evt_run_2_start", "Run auf HQ", "run", "run:evt_run_2_start"),
      entry("evt_run_1_end", "Run auf HQ", "run", "run:evt_run_1_start"),
      entry("evt_run_1_start", "Run auf HQ", "run", "run:evt_run_1_start"),
    ]);

    expect(groups.map((group) => group.label)).toEqual(["Run auf HQ", "Run auf HQ"]);
    expect(groups.map((group) => group.entries.map((groupEntry) => groupEntry.item?.id))).toEqual([
      ["evt_run_2_end", "evt_run_2_start"],
      ["evt_run_1_end", "evt_run_1_start"],
    ]);
  });

  it("still merges adjacent non-run groups by their visible label", () => {
    const groups = groupChronicleEntriesForRender([
      entry("evt_gain_1", "Zug 1 - Korp", "corp"),
      entry("evt_gain_2", "Zug 1 - Korp", "corp"),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.entries.map((groupEntry) => groupEntry.item?.id)).toEqual(["evt_gain_1", "evt_gain_2"]);
  });
});
