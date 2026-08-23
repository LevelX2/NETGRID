import { describe, expect, it } from "vitest";

import {
  HAND_CARD_MINIMUM_VISIBLE_STEP_PX,
  HAND_CARD_ROW_GAP_PX,
  handCardRowLayout,
  handCardRowPreferredWidth,
} from "./hand-card-layout";

describe("handCardRowLayout", () => {
  it("reports the unwrapped preferred width independently of a previous wrap", () => {
    expect(
      handCardRowPreferredWidth({
        cardWidth: 108,
        cardGap: HAND_CARD_ROW_GAP_PX,
        count: 5,
      }),
    ).toBeCloseTo(390.56);
  });

  it("keeps a hand in one row while the minimum visible card step fits", () => {
    expect(
      handCardRowLayout({
        availableWidth: 300,
        cardWidth: 108,
        cardGap: 0,
        count: 6,
        maxRows: 2,
      }),
    ).toEqual({
      cardsPerRow: 6,
      overlapOffsetPx: -70,
      rowCount: 1,
    });
  });

  it("wraps a regular-limit Corp HQ hand into two balanced rows before over-compressing", () => {
    const layout = handCardRowLayout({
      availableWidth: 220,
      cardWidth: 108,
      cardGap: 0,
      count: 6,
      maxRows: 2,
    });

    expect(layout).toEqual({
      cardsPerRow: 3,
      overlapOffsetPx: -52,
      rowCount: 2,
    });
    expect((220 - 108) / (layout.cardsPerRow - 1)).toBeGreaterThanOrEqual(
      HAND_CARD_MINIMUM_VISIBLE_STEP_PX,
    );
  });

  it("preserves the minimum visible step for a scaled seven-card hand", () => {
    expect(
      handCardRowLayout({
        availableWidth: 184,
        cardWidth: 86,
        cardGap: 0,
        count: 7,
        maxRows: 2,
      }),
    ).toEqual({
      cardsPerRow: 4,
      overlapOffsetPx: -53,
      rowCount: 2,
    });
  });

  it("keeps the existing single-row contract for other hand zones", () => {
    expect(
      handCardRowLayout({
        availableWidth: 220,
        cardWidth: 108,
        cardGap: 0,
        count: 6,
      }),
    ).toEqual({
      cardsPerRow: 6,
      overlapOffsetPx: -76,
      rowCount: 1,
    });
  });
});
