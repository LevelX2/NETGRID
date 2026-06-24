import { describe, expect, it } from "vitest";
import { ORDERED_FORT_REBUILD_SEQUENCE_CONTRACT } from "./ordered-fort-rebuild-sequence";
import { RUN_WINDOW_ACTION_RESOLVERS } from "./run-window-registry";

describe("run window registry", () => {
  it("keeps run window resolver ids unique and explicit", () => {
    const resolverIds = RUN_WINDOW_ACTION_RESOLVERS.map(
      (resolver) => resolver.id,
    );

    expect(new Set(resolverIds).size).toBe(resolverIds.length);
    expect(resolverIds.sort()).toEqual([
      "fort_pass_advancement_after_passing_last_ice",
      "hq_ice_swap_run_window",
      "start_run_ice_reposition",
    ]);
  });

  it("keeps resolver windows explicit", () => {
    expect(
      RUN_WINDOW_ACTION_RESOLVERS.map((resolver) => [
        resolver.id,
        resolver.window,
      ]).sort(),
    ).toEqual([
      ["fort_pass_advancement_after_passing_last_ice", "corp_fort_pass_window"],
      ["hq_ice_swap_run_window", "corp_root_rez_window"],
      ["start_run_ice_reposition", "corp_root_rez_window"],
    ]);
  });

  it("keeps run-window and on-rez sequence contracts explicit", () => {
    const runWindowContracts = RUN_WINDOW_ACTION_RESOLVERS.map((resolver) => ({
      id: resolver.id,
      window: resolver.window,
    })).sort((left, right) => left.id.localeCompare(right.id));
    const onRezSequenceContracts = [
      {
        kind: ORDERED_FORT_REBUILD_SEQUENCE_CONTRACT.kind,
        trigger: ORDERED_FORT_REBUILD_SEQUENCE_CONTRACT.trigger,
        visibility: ORDERED_FORT_REBUILD_SEQUENCE_CONTRACT.visibility,
      },
    ];

    expect(runWindowContracts).toEqual([
      {
        id: "fort_pass_advancement_after_passing_last_ice",
        window: "corp_fort_pass_window",
      },
      {
        id: "hq_ice_swap_run_window",
        window: "corp_root_rez_window",
      },
      { id: "start_run_ice_reposition", window: "corp_root_rez_window" },
    ]);
    expect(onRezSequenceContracts).toEqual([
      {
        kind: "ordered_fort_rebuild_sequence",
        trigger: "on_rez",
        visibility: "hidden_info_barrier",
      },
    ]);
  });
});
