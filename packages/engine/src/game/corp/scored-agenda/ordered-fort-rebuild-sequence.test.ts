import { describe, expect, it } from "vitest";
import { sanitizeCardImplementationSurfacePayload } from "../../view/surface-policy";
import {
  ORDERED_FORT_REBUILD_SEQUENCE_CONTRACT,
  ORDERED_FORT_REBUILD_STEPS,
  orderedFortRebuildPublicPayload,
} from "./ordered-fort-rebuild-sequence";

describe("ordered fort rebuild sequence contract", () => {
  it("defines the pilot sequence without runtime card activation", () => {
    expect(ORDERED_FORT_REBUILD_STEPS).toEqual([
      "capture_source_fort",
      "select_replacement_hq_cards",
      "validate_ordered_install_set",
      "return_removed_cards_to_hq",
      "install_replacements_in_order",
      "complete",
    ]);
    expect(ORDERED_FORT_REBUILD_SEQUENCE_CONTRACT).toMatchObject({
      kind: "ordered_fort_rebuild_sequence",
      trigger: "on_rez",
      sourceZone: "corp_root",
      sourceType: "installed_corp_upgrade",
      targetFort: "source_fort",
      include: "root_and_ice",
      replacementZone: "hq",
      replacementCount: "same_as_removed_count",
      installCost: "free",
      visibility: "hidden_info_barrier",
      publicPayload: {
        exposeCardIds: false,
        exposeCounts: true,
        exposeTargetServerId: true,
      },
    });
  });

  it("emits only count and public-location payload", () => {
    const payload = orderedFortRebuildPublicPayload({
      sourceDefinitionId: "onr_proteus_069_pavit-bharat",
      targetServerId: "remote_1",
      removedCardCount: 3,
      replacementCardCount: 3,
      installedIceCount: 2,
      installedRootCount: 1,
    });

    expect(payload).toEqual({
      sequenceKind: "ordered_fort_rebuild_sequence",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "ordered_fort_rebuild_sequence",
      sourceDefinitionId: "onr_proteus_069_pavit-bharat",
      targetServerId: "remote_1",
      removedCardCount: 3,
      replacementCardCount: 3,
      installedIceCount: 2,
      installedRootCount: 1,
    });
    expect(JSON.stringify(payload)).not.toContain("card_");
  });

  it("rejects hidden HQ card lists on public payload surfaces", () => {
    expect(() =>
      sanitizeCardImplementationSurfacePayload({
        ...orderedFortRebuildPublicPayload({
          sourceDefinitionId: "onr_proteus_069_pavit-bharat",
          targetServerId: "remote_1",
          removedCardCount: 1,
          replacementCardCount: 1,
          installedIceCount: 1,
          installedRootCount: 0,
        }),
        hqReplacementCardIds: "ice_1",
      }),
    ).toThrow(/hidden card data/i);
  });
});
