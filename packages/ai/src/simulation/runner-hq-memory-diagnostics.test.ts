import { describe, expect, it } from "vitest";

import { runnerHqMemoryInvalidationFlags } from "./runner-hq-memory-diagnostics";

describe("runner HQ memory invalidation diagnostics", () => {
  it("matches HQ invalidation reasons exactly", () => {
    expect(
      runnerHqMemoryInvalidationFlags([
        "corp_draw_added_unknown_hq_card",
        "known_hq_card_installed",
        "known_hq_card_played",
        "corp_discarded_hq_card",
        "shuffle_changed_hq_hand",
      ]),
    ).toMatchObject({
      hqMemoryInvalidatedByDraw: true,
      hqMemoryInvalidatedByInstall: true,
      hqMemoryInvalidatedByPlay: true,
      hqMemoryInvalidatedByDiscard: true,
      hqMemoryInvalidatedByShuffleOrReorder: true,
    });
  });

  it("ignores HQ invalidation substring noise", () => {
    expect(
      runnerHqMemoryInvalidationFlags([
        "not_corp_draw_added_unknown_hq_card_noise",
        "known_hq_card_installedish_noise",
        "corp_played_unknown_hq_cardish_noise",
        "corp_discarded_hq_cardish_noise",
        "shuffle_changed_hq_handish_noise",
      ]),
    ).toEqual({});
  });
});
