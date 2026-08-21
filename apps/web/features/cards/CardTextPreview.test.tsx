import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("CardTextPreview", () => {
  it("provides density-aware title, metrics and formatted rules", () => {
    const source = readFileSync(
      new URL("./CardTextPreview.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("density-${density} type-${normalizedType}");
    expect(source).toContain("cardTextPreviewTitle");
    expect(source).toContain("cardTextPreviewMetrics");
    expect(source).toContain("renderRuleTextSegments");
    expect(source).toContain("<SubroutineIcon />");
  });

  it("shows a clear loading state until catalog rules arrive", () => {
    const source = readFileSync(
      new URL("./CardTextPreview.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain('useTranslations("Cards")');
    expect(source).toContain('t("textLoading")');
    expect(source).toMatch(
      /return \/\^\[a-z\]\[a-z0-9_-\]\*\$\/\.test\(normalized\)\s*\? normalized\s*:\s*"unknown"/u,
    );
  });
});
