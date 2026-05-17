import { describe, expect, it } from "vitest";
import {
  activeAiApprovedCardIds,
  activeRuntimeCardIds,
  ACTIVE_CARD_SUPPORT_AI_GROUPS,
  ACTIVE_CARD_SUPPORT_RUNTIME_GROUPS,
} from "./card-set-loader";
import {
  buildAiApprovedCardIds,
  buildRuntimeCardIds,
  findDuplicateAiApprovalCards,
  findDuplicateRuntimeGateCards,
} from "./gate-evidence";

describe("card support evidence projections", () => {
  it("projects runtime and AI batches from active support data", () => {
    expect(
      buildRuntimeCardIds(ACTIVE_CARD_SUPPORT_RUNTIME_GROUPS).slice().sort(),
    ).toEqual(activeRuntimeCardIds.slice().sort());
    expect(
      buildAiApprovedCardIds(ACTIVE_CARD_SUPPORT_AI_GROUPS).slice().sort(),
    ).toEqual(activeAiApprovedCardIds.slice().sort());
  });

  it("keeps card support projections duplicate-free", () => {
    expect(findDuplicateRuntimeGateCards(ACTIVE_CARD_SUPPORT_RUNTIME_GROUPS)).toEqual(
      [],
    );
    expect(findDuplicateAiApprovalCards(ACTIVE_CARD_SUPPORT_AI_GROUPS)).toEqual([]);
  });
});
