import { describe, expect, it } from "vitest";

import { archiveCardStepPx } from "../features/game-board/archive-stack-layout";

describe("archiveCardStepPx", () => {
  it("keeps the default card step while the archive stack fits", () => {
    expect(
      archiveCardStepPx({
        availableWidth: 1320,
        archiveCardScale: 1,
        faceupItemCount: 18,
        facedownItemCount: 5,
        hasToggleColumn: true,
      }),
    ).toBe(50);
  });

  it("compresses the archive card step when both archive piles would exceed the lane", () => {
    expect(
      archiveCardStepPx({
        availableWidth: 850,
        archiveCardScale: 1,
        faceupItemCount: 18,
        facedownItemCount: 5,
        hasToggleColumn: true,
      }),
    ).toBe(28);
  });

  it("clamps to a small visible step instead of returning a negative overlap", () => {
    expect(
      archiveCardStepPx({
        availableWidth: 300,
        archiveCardScale: 1,
        faceupItemCount: 18,
        facedownItemCount: 18,
        hasToggleColumn: true,
      }),
    ).toBe(8);
  });
});
