import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  new URL("./globals.css", import.meta.url),
  "utf8",
);
const cardViewSource = readFileSync(
  new URL("../features/cards/CardView.tsx", import.meta.url),
  "utf8",
);

describe("NETGRID card back display", () => {
  it.each([".opponentCueCardBack", ".runnerStackBack"])(
    "keeps the complete bundled back visible for %s",
    (selector) => {
      const rule = cssRule(selector);
      expect(rule).toContain("background-size: cover, contain;");
      expect(rule).toContain("background-position: center, center;");
      expect(rule).toContain("background-repeat: no-repeat, no-repeat;");
    },
  );

  it("renders board backs on a dedicated contained layer", () => {
    const rule = cssRule(".card.hiddenBack .cardBackImage");
    expect(rule).toContain("position: absolute;");
    expect(rule).toContain("background-size: contain;");
    expect(cardViewSource).toContain("cardBackSide = forceCardBack");
    expect(cardViewSource).toContain(
      "className={`cardBackImage ${cardBackSide}CardBackImage`}",
    );
  });

  it("uses the two bundled NETGRID backs without an imported card-image route", () => {
    expect(globalsCss).toContain('url("/card-backs/netgrid-runner-back.png")');
    expect(globalsCss).toContain('url("/card-backs/netgrid-corp-back.png")');
    expect(globalsCss).not.toContain("/api/card-images/netgrid-corp-back");
    expect(globalsCss).not.toContain("/api/card-images/netgrid-runner-back");
  });
});

function cssRule(selector: string): string {
  const start = globalsCss.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`CSS-Regel ${selector} fehlt.`);
  const end = globalsCss.indexOf("}", start);
  if (end < 0) throw new Error(`CSS-Regel ${selector} ist unvollständig.`);
  return globalsCss.slice(start, end + 1);
}
