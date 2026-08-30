import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("independent card and tooltip display preferences", () => {
  it("offers the same three presentation choices through separate controls", () => {
    const settingsSource = readFileSync(
      new URL("../features/settings/OptionsPanel.tsx", import.meta.url),
      "utf8",
    );
    const previewSource = readFileSync(
      new URL("../features/cards/CardPreviewPanel.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(settingsSource).toContain("export function CardDisplayModeSelector");
    expect(settingsSource).toContain("function CardTooltipModeSelector");
    expect(settingsSource).toContain('data-testid="card-tooltip-image"');
    expect(settingsSource).toContain('data-testid="card-tooltip-text"');
    expect(settingsSource).toContain('data-testid="card-tooltip-compact"');
    expect(settingsSource.indexOf("<CardDisplaySettings")).toBeLessThan(
      settingsSource.indexOf("<CardTooltipSettings"),
    );
    expect(settingsSource.indexOf("<CardTooltipSettings")).toBeLessThan(
      settingsSource.indexOf("<CardImageSkinSettings"),
    );
    expect(settingsSource).toContain('className="cardTooltipSettingsControls"');
    expect(settingsSource).toContain('className="cardTooltipSecondaryControls"');
    expect(settingsSource).toContain('disabled={mode === "image"}');
    expect(styles).toMatch(
      /\.cardTooltipSecondaryControls\s*\{[\s\S]*?grid-template-columns: minmax\(150px, 0\.65fr\) minmax\(240px, 1\.35fr\);/u,
    );
    expect(previewSource).not.toContain("CardDisplayModeSelector");
    expect(previewSource).not.toContain("CardTooltipModeSelector");
    expect(previewSource).not.toContain("onDisplayMode");
    expect(previewSource).not.toContain("onTooltipMode");
  });

  it("lets text tooltips size to their content while retaining a viewport cap", () => {
    const cardSource = readFileSync(
      new URL("../features/cards/CardView.tsx", import.meta.url),
      "utf8",
    );
    const chronicleSource = readFileSync(
      new URL(
        "../features/chronicle/ChronicleCardTrigger.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    const deckSource = readFileSync(
      new URL(
        "../features/decks/DeckCardTooltipTrigger.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    const styles = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    for (const source of [cardSource, chronicleSource, deckSource]) {
      expect(source).toContain('width: "max-content"');
      expect(source).toContain("maxWidth: `${tooltipMaxWidth}px`");
    }
    expect(styles).toMatch(
      /\.cardTooltip\s*\{[\s\S]*?width: max-content;[\s\S]*?max-width: min\(300px, calc\(100vw - 32px\)\);/u,
    );
    expect(styles).toMatch(
      /\.chronicleCardTooltip\s*\{[\s\S]*?width: max-content;[\s\S]*?max-width: min\(300px, calc\(100vw - 32px\)\);/u,
    );
  });
});
