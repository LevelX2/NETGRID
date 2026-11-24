import { describe, expect, it } from "vitest";
import {
  cardActionMenuVerticalPosition,
  isCardActionSurfaceTarget,
} from "./card-action-menu-ui";

describe("card action menu UI helpers", () => {
  it("detects clicks inside the card action surface", () => {
    const target = {
      closest: (selector: string) =>
        selector === "[data-card-action-surface='true']" ? {} : null,
    } as unknown as EventTarget;

    expect(isCardActionSurfaceTarget(target)).toBe(true);
  });

  it("treats clicks outside the card action surface as outside clicks", () => {
    const target = { closest: () => null } as unknown as EventTarget;

    expect(isCardActionSurfaceTarget(target)).toBe(false);
    expect(isCardActionSurfaceTarget(null)).toBe(false);
  });

  it("uses the lower card edge when the rendered menu fits exactly below", () => {
    const position = cardActionMenuVerticalPosition(
      { top: 320, bottom: 450 },
      0,
      500,
      38,
      38,
    );
    expect(position).toEqual({ above: false, top: 454, maxHeight: 38 });
  });

  it("places the menu's bottom edge immediately above a card near the viewport bottom", () => {
    const position = cardActionMenuVerticalPosition(
      { top: 570, bottom: 690 },
      200,
      500,
      74,
      34,
    );
    expect(position.above).toBe(true);
    expect(position.top + 74).toBe(566);
  });

  it("uses room below a card in a zoomed, offset visual viewport", () => {
    const position = cardActionMenuVerticalPosition(
      { top: 580, bottom: 710 },
      480,
      400,
      96,
      44,
    );
    expect(position).toEqual({ above: false, top: 714, maxHeight: 158 });
  });

  it("keeps a long menu against the card and limits it to the roomier side", () => {
    const position = cardActionMenuVerticalPosition(
      { top: 320, bottom: 440 },
      0,
      600,
      720,
      44,
    );
    expect(position).toEqual({ above: true, top: 8, maxHeight: 308 });
  });
});
