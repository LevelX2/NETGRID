import { describe, expect, it } from "vitest";

import { shouldActivateChronicleCardTouchDoubleTap } from "./chronicleInteraction";

describe("chronicle card interaction", () => {
  it("activates touch card preview only for deliberate double taps", () => {
    expect(shouldActivateChronicleCardTouchDoubleTap(1000, 1061)).toBe(true);
    expect(shouldActivateChronicleCardTouchDoubleTap(1000, 1419)).toBe(true);
    expect(shouldActivateChronicleCardTouchDoubleTap(1000, 1060)).toBe(false);
    expect(shouldActivateChronicleCardTouchDoubleTap(1000, 1420)).toBe(false);
    expect(shouldActivateChronicleCardTouchDoubleTap(1000, 1700)).toBe(false);
  });
});
