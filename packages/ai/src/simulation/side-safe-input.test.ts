import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { assertAiInputIsSideSafe } from "./side-safe-input";

describe("assertAiInputIsSideSafe", () => {
  it("rejects forbidden hidden-input field tokens", () => {
    expect(
      assertAiInputIsSideSafe({
        cardInstances: {},
      } as unknown as AiDecisionInput),
    ).toBe(false);
  });

  it("bounds forbidden field detection to exact tokens", () => {
    expect(
      assertAiInputIsSideSafe({
        cardInstancesish: {},
        privatePayloadish: "visible test noise",
      } as unknown as AiDecisionInput),
    ).toBe(true);
  });
});
