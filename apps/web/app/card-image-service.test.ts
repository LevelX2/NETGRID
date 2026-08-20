import { describe, expect, it } from "vitest";
import { localizedDeCardTitle } from "./card-image-manifest";
import { localCardImageUrl, withCardImageVariant } from "./card-image-service";
import { readFileSync } from "node:fs";

describe("card image client service", () => {
  it("keeps generated and local O:NR image URLs versioned", () => {
    expect(localCardImageUrl("simple_agenda")).toBe("/api/card-images/simple_agenda?v=2026-05-23-local-onr-assets-3");
    expect(localCardImageUrl("onr_v1_001_afreet")).toBe("/api/card-images/onr_v1_001_afreet?v=2026-05-23-local-onr-assets-3");
    expect(localCardImageUrl("onr_proteus_071_raymond-ellison")).toBe("/api/card-images/onr_proteus_071_raymond-ellison?v=2026-05-23-local-onr-assets-3");
    expect(localCardImageUrl("onr_classic_001_data-fort-remapping")).toBe("/api/card-images/onr_classic_001_data-fort-remapping?v=2026-05-23-local-onr-assets-3");
  });

  it("does not mint image URLs for hidden or unsupported identifiers", () => {
    expect(localCardImageUrl(undefined)).toBeUndefined();
    expect(localCardImageUrl("hidden-card")).toBeUndefined();
    expect(localCardImageUrl("netgrid-corp-back")).toBeUndefined();
  });

  it("prefers registered German display-only card skins when requested", () => {
    expect(localCardImageUrl("onr_v1_188_ai-chief-financial-officer", { preferGerman: true })).toBe(
      "/api/card-images/onr_v1_188_ai-chief-financial-officer?skin=de&v=2026-05-24-localized-de-assets-1"
    );
    expect(localCardImageUrl("onr_v1_001_afreet", { preferGerman: true })).toBe(
      "/api/card-images/onr_v1_001_afreet?v=2026-05-23-local-onr-assets-3"
    );
  });

  it("exposes German display-only titles for registered skin cards", () => {
    expect(localizedDeCardTitle("onr_v1_188_ai-chief-financial-officer")).toBe("KI-Finanzvorstand");
    expect(localizedDeCardTitle("onr_v1_001_afreet")).toBeUndefined();
  });

  it("adds runtime variants only to the protected local image route", () => {
    expect(withCardImageVariant("/api/card-images/simple_agenda?v=current", "thumb")).toBe(
      "/api/card-images/simple_agenda?v=current&variant=thumb"
    );
    expect(withCardImageVariant("https://example.invalid/card.webp", "full")).toBe("https://example.invalid/card.webp");
    expect(withCardImageVariant(undefined, "preview")).toBeUndefined();
  });

  it("reports an unavailable image only after its optional localized fallback also fails", () => {
    const source = readFileSync(
      new URL("../features/cards/card-image-service.ts", import.meta.url),
      "utf8",
    );

    expect(source).toContain('target.dataset.fallbackApplied = "true"');
    expect(source).toContain("onUnavailable?.(event)");
  });

  it("switches a known image-mode card to its text layout after all image sources fail", () => {
    const source = readFileSync(
      new URL("../features/cards/CardView.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain(
      "const [cardImageUnavailable, setCardImageUnavailable] = useState(false)",
    );
    expect(source).toMatch(
      /const usesTextCardLayout\s*=\s*displayMode === "text-card"\s*\|\|\s*\(displayMode === "placeholder" && !cardImageUrl\)/u,
    );
    expect(source).toContain("onUnavailable={() => setCardImageUnavailable(true)}");
    expect(source).not.toContain('alt={`Kartenbild ${card.title ?? "Karte"}`}');
  });
});
