import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { applyRunWindowPayloadPatch } from "./run-window-sequence-types";

describe("run window sequence payload patches", () => {
  it("merges sanitized primitive run-window payload patches", () => {
    const legalAction = {
      side: "corp",
      costs: [],
      payload: { existing: true },
    } as unknown as LegalAction;

    const payload = applyRunWindowPayloadPatch(legalAction, {
      sequenceKind: "ordered_fort_rebuild_sequence",
      hiddenZoneBarrier: true,
      sourceDefinitionId: "onr_proteus_069_pavit-bharat",
      targetServerId: "remote_1",
      removedCardCount: 2,
      replacementCardCount: 2,
    });

    expect(payload).toEqual({
      existing: true,
      sequenceKind: "ordered_fort_rebuild_sequence",
      hiddenZoneBarrier: true,
      sourceDefinitionId: "onr_proteus_069_pavit-bharat",
      targetServerId: "remote_1",
      removedCardCount: 2,
      replacementCardCount: 2,
    });
    expect(legalAction.payload).toEqual(payload);
  });

  it("rejects hidden card-list fields before mutating the legal action", () => {
    const legalAction = {
      side: "corp",
      costs: [],
      payload: { existing: true },
    } as unknown as LegalAction;

    expect(() =>
      applyRunWindowPayloadPatch(legalAction, {
        hqReplacementCardIds: "secret_card",
      }),
    ).toThrow(/hidden card data/i);
    expect(legalAction.payload).toEqual({ existing: true });
  });
});
