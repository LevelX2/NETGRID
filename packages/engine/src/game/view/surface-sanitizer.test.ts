import { describe, expect, it } from "vitest";
import { sanitizeCardImplementationSurfacePayload } from "./surface-policy";

describe("sanitizeCardImplementationSurfacePayload", () => {
  it("keeps public counts, public definition ids and explicit facts", () => {
    expect(
      sanitizeCardImplementationSurfacePayload({
        hiddenZoneBarrier: true,
        hiddenZoneAction: "agenda_purge_rd_top3",
        revealedCount: 3,
        publicRevealDefinitionIds: "2521798093,3465088428",
      }),
    ).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "agenda_purge_rd_top3",
      revealedCount: 3,
      publicRevealDefinitionIds: "2521798093,3465088428",
    });
  });

  it("rejects hidden-zone card list fields", () => {
    expect(() =>
      sanitizeCardImplementationSurfacePayload({
        hiddenHqCardIds: "corp_card_1,corp_card_2",
      }),
    ).toThrow(/hidden card data/);
  });
});
