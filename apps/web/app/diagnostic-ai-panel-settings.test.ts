import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const catalogSource = readFileSync(
  new URL("../features/catalog/CatalogSupportPanels.tsx", import.meta.url),
  "utf8",
);
const deckProfileSource = readFileSync(
  new URL("../features/decks/DeckStrategyProfilePanel.tsx", import.meta.url),
  "utf8",
);
const optionsSource = readFileSync(
  new URL("../features/settings/OptionsPanel.tsx", import.meta.url),
  "utf8",
);

describe("diagnostic AI panel display settings", () => {
  it("keeps both complete diagnostic panels collapsed by default", () => {
    expect(catalogSource).toContain("const [isOpen, setIsOpen] = useState(false)");
    expect(deckProfileSource).toContain(
      "const [isOpen, setIsOpen] = useState(false)",
    );
    expect(catalogSource).toContain("writeCatalogAiInspectorOpen");
    expect(deckProfileSource).toContain("writeDeckStrategyProfileOpen");
  });

  it("adds German explanations to both panel headings", () => {
    expect(catalogSource).toContain("Interne strukturierte Merkmale");
    expect(catalogSource).toContain("KI-Semantik-Zielmodell");
    expect(deckProfileSource).toContain(
      "Interne, nur lokal sichtbare KI-Analyse",
    );
    expect(deckProfileSource).toContain("Diagnostisches KI-Deckprofil");
  });

  it("connects both panels to the global AI detail information option", () => {
    expect(catalogSource).toContain("useAiDetailInformationSetting");
    expect(deckProfileSource).toContain("useAiDetailInformationSetting");
    expect(optionsSource).toContain(
      'data-testid="ai-detail-information-toggle"',
    );
    expect(optionsSource).toContain('t("aiDetails")');
  });
});
