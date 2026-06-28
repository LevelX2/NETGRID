import { describe, expect, it } from "vitest";

import {
  knownPositionInvalidationReferencesInstallOrMove,
  runnerKnownCardPositionInvalidationFlags,
} from "./runner-known-card-position-diagnostics";

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

  it("matches remote memory install-or-move invalidation by bounded terms", () => {
    expect(
      [
        "known_hq_card_installed",
        "corp_installed_hidden_hq_card",
        "known_hq_card_moved",
        "hidden_zone_move_changed_hq",
      ].every(knownPositionInvalidationReferencesInstallOrMove),
    ).toBe(true);
    expect(
      [
        "rd_access_removed_top_card",
        "reinstall_noise",
        "movementish_noise",
        "movie_noise",
      ].some(knownPositionInvalidationReferencesInstallOrMove),
    ).toBe(false);
  });
});
