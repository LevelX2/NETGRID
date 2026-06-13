import { describe, expect, it } from "vitest";
import { RUN_WINDOW_ACTION_RESOLVERS } from "./run-window-registry";

describe("run window registry", () => {
  it("keeps run window resolver ids unique and explicit", () => {
    const resolverIds = RUN_WINDOW_ACTION_RESOLVERS.map(
      (resolver) => resolver.id,
    );

    expect(new Set(resolverIds).size).toBe(resolverIds.length);
    expect(resolverIds.sort()).toEqual([
      "fort_pass_advancement_after_passing_last_ice",
      "singapore_city_grid_fort_ice_swap",
      "start_run_ice_reposition",
    ]);
  });

  it("keeps resolver windows explicit", () => {
    expect(
      new Set(RUN_WINDOW_ACTION_RESOLVERS.map((resolver) => resolver.window)),
    ).toEqual(new Set(["corp_fort_pass_window", "corp_root_rez_window"]));
  });
});
