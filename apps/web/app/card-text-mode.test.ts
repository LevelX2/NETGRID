import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("text card display", () => {
  it("uses a fixed card frame and an unclamped measured text scale", () => {
    const cardSource = readFileSync(
      new URL("../features/cards/CardView.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(
      new URL("./globals.css", import.meta.url),
      "utf8",
    );

    expect(cardSource).toContain("const [textCardScale, setTextCardScale] = useState(1)");
    expect(cardSource).toContain("const requiredHeight = element.scrollHeight");
    expect(cardSource).toContain('style={cardStyle}');
    expect(styles).toContain(".card.textCard {");
    expect(styles).toContain("aspect-ratio: 5 / 7;");
    expect(styles).toContain(".card.textCard .cardRulesPreview {");
    expect(styles).toContain("-webkit-line-clamp: unset;");
  });

  it("keeps type colours as subtle text-card accents", () => {
    const styles = readFileSync(
      new URL("./globals.css", import.meta.url),
      "utf8",
    );

    expect(styles).toContain(".card.textCard.agenda {");
    expect(styles).toContain(".card.textCard.ice {");
    expect(styles).toContain(".card.textCard.program {");
    expect(styles).toContain(".card.textCard.hardware {");
  });
});
