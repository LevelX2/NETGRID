import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("decorated match-start selects", () => {
  it("owns the native appearance so WebKit preserves icon and text spacing", () => {
    expect(css).toMatch(
      /\.sideSelectionControl select,\s*\.deckSlotControl select \{[^}]*-webkit-appearance: none;[^}]*appearance: none;[^}]*padding-right: 36px;/u,
    );
    expect(css).toMatch(
      /\.sideSelectionControl::after,\s*\.deckSlotControl::after \{[^}]*right: 14px;[^}]*pointer-events: none;/u,
    );
    expect(css).toMatch(
      /\.sideSelectionControl select \{[^}]*padding-left: 44px;/u,
    );
    expect(css).toMatch(/\.deckSlotSelect select \{[^}]*padding-left: 34px;/u);
  });
});
