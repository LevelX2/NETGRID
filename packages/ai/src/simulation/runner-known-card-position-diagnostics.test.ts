import { describe, expect, it } from "vitest";

import { runnerKnownCardPositionInvalidationFlags } from "./runner-known-card-position-diagnostics";

describe("runner known card position invalidation diagnostics", () => {
  it("matches known-position invalidation reasons exactly", () => {
    expect(
      runnerKnownCardPositionInvalidationFlags([
        "known_rnd_top_moved_to_hq",
        "corp_draw_from_rd",
        "remote_state_changed",
        "conceal",
      ]),
    ).toMatchObject({
      knownRndTopMovedToHq: true,
      hqKnownFromRndDraw: true,
      knownRndTopInvalidated: true,
      remoteMemoryInvalidatedByInstallOrMove: true,
      knownUnrezzedIceInvalidated: true,
    });
  });

  it("ignores known-position invalidation substring noise", () => {
    expect(
      runnerKnownCardPositionInvalidationFlags([
        "known_rnd_top_moved_to_hqish_noise",
        "not_corp_draw_from_rd_noise",
        "remote_state_changedish_noise",
        "concealment_noise",
        "reorderish_noise",
      ]),
    ).toEqual({});
  });
});
