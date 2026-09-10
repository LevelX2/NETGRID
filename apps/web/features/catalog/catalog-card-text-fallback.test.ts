import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("catalog card text fallback", () => {
  it("keeps the preview slot and replaces an unavailable image with full card text", () => {
    const source = readFileSync(
      new URL("./CatalogPanel.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain(
      "const [catalogImageUnavailable, setCatalogImageUnavailable] = useState(false)",
    );
    expect(source).toContain(
      "onUnavailable={() => setCatalogImageUnavailable(true)}",
    );
    expect(source).toContain('catalogImageUrl ? "hasImage" : "textFallback"');
    expect(source).toContain("<CardTextPreview");
    expect(source).toContain("typeLine={formatCardTypeLine(detail)}");
    expect(source).toContain("metricLine={cardMetricLine(detail)}");
    expect(source).toContain('density="preview"');
    expect(source).not.toContain("Kartenbild ${detail.title}");
  });

  it("resets the terminal image error when a different image source is selected", () => {
    const source = readFileSync(
      new URL("./CatalogPanel.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("setCatalogImageUnavailable(false)");
    expect(source).toMatch(
      /\[\s*detail\?\.catalogCardId,\s*catalogImageSource\.src,\s*catalogImageSource\.fallbackSrc,?\s*\]/,
    );
  });
});
