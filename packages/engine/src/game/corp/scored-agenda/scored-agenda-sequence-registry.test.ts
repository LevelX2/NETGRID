import { describe, expect, it } from "vitest";
import { SCORED_AGENDA_CHOICE_RESOLVERS } from "./scored-agenda-sequence-registry";

describe("scored agenda sequence registry", () => {
  it("keeps resolver ids unique", () => {
    const ids = SCORED_AGENDA_CHOICE_RESOLVERS.map((resolver) => resolver.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("routes known sequence choice sources to exactly one resolver", () => {
    const sources = [
      "v162.priority_requisition:priority_agenda:8",
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:data_fort_agenda:8",
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:data_fort_agenda:remote_1:10:8",
      "v1922.security_purge_install_targets:security_purge_agenda:ice_1,asset_1:8",
    ];

    for (const source of sources) {
      const matches = SCORED_AGENDA_CHOICE_RESOLVERS.filter((resolver) =>
        resolver.matches(source),
      );
      expect(matches, source).toHaveLength(1);
    }
  });
});
