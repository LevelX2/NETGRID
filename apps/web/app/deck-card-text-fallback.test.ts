import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("deck card image fallback", () => {
  it("switches the thumbnail to text after all image variants fail", () => {
    const source = readFileSync(
      new URL("../features/decks/DeckCardThumb.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain(
      "const [imageUnavailable, setImageUnavailable] = useState(false)",
    );
    expect(source).toContain("onUnavailable={() => setImageUnavailable(true)}");
    expect(source).toContain("<CardTextPreview");
    expect(source).not.toContain("title.slice(0, 1)");
  });

  it("supplies type, metrics and rules in the deck editor and deck table", () => {
    const builderSource = readFileSync(
      new URL("../features/decks/DeckBuilderCards.tsx", import.meta.url),
      "utf8",
    );
    const tableSource = readFileSync(
      new URL("../features/decks/DeckTableBoard.tsx", import.meta.url),
      "utf8",
    );

    expect(builderSource).toContain("typeLine={formatCardTypeLine(card)}");
    expect(builderSource).toContain("metricLine={cardMetricLine(detail)}");
    expect(builderSource).toContain('textDensity="table"');
    expect(tableSource).toContain("typeLine={formatCardTypeLine(card)}");
    expect(tableSource).toContain("metricLine={cardMetricLine(detail)}");
  });

  it("falls back from an unavailable image tooltip to the enhanced text tooltip", () => {
    const source = readFileSync(
      new URL("../features/decks/DeckCardTooltipTrigger.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain(
      "const [tooltipImageUnavailable, setTooltipImageUnavailable] = useState(false)",
    );
    expect(source).toContain(
      'tooltipMode === "image" ? "enhanced" : tooltipMode',
    );
    expect(source).toContain(
      "onUnavailable={() => setTooltipImageUnavailable(true)}",
    );
    expect(source).toContain("cardTooltipType-${card.type}");
    expect(source).not.toContain("Kartenbild ${card.title");
  });

  it("shrinks long text previews instead of hard-clamping their rule lines", () => {
    const source = readFileSync(
      new URL("../features/cards/CardTextPreview.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("new ResizeObserver(scheduleFit)");
    expect(source).toContain('"--card-text-preview-scale": textScale');
    expect(source).not.toContain("line-clamp");
  });
});
