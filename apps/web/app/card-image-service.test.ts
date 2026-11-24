import { describe, expect, it } from "vitest";
import { localizedDeCardTitle } from "./card-image-manifest";
import {
  localCardImageUrl,
  withCardImageCollectionRevision,
  withCardImageVariant,
} from "./card-image-service";
import { readFileSync } from "node:fs";

describe("card image client service", () => {
  it("keeps generated and local O:NR image URLs versioned", () => {
    expect(localCardImageUrl(588)).toBe(
      "/api/card-images/588?v=2026-05-23-local-onr-assets-3",
    );
    expect(localCardImageUrl(213)).toBe(
      "/api/card-images/213?v=2026-05-23-local-onr-assets-3",
    );
    expect(localCardImageUrl(129)).toBe(
      "/api/card-images/129?v=2026-05-23-local-onr-assets-3",
    );
    expect(localCardImageUrl(5)).toBe(
      "/api/card-images/5?v=2026-05-23-local-onr-assets-3",
    );
  });

  it("does not mint image URLs for hidden or unsupported identifiers", () => {
    expect(localCardImageUrl(undefined)).toBeUndefined();
    expect(localCardImageUrl(null)).toBeUndefined();
    expect(localCardImageUrl(-1)).toBeUndefined();
  });

  it("prefers registered German display-only card skins when requested", () => {
    expect(
      localCardImageUrl(400, {
        preferGerman: true,
      }),
    ).toBe(
      "/api/card-images/400?skin=de&v=2026-05-24-localized-de-assets-1",
    );
    expect(localCardImageUrl(213, { preferGerman: true })).toBe(
      "/api/card-images/213?v=2026-05-23-local-onr-assets-3",
    );
  });

  it("exposes German display-only titles for registered skin cards", () => {
    expect(localizedDeCardTitle(400)).toBe(
      "KI-Finanzvorstand",
    );
    expect(localizedDeCardTitle(213)).toBeUndefined();
  });

  it("adds runtime variants only to the protected local image route", () => {
    expect(
      withCardImageVariant("/api/card-images/588?v=current", "thumb"),
    ).toBe("/api/card-images/588?v=current&variant=thumb");
    expect(
      withCardImageVariant("https://example.invalid/card.webp", "full"),
    ).toBe("https://example.invalid/card.webp");
    expect(withCardImageVariant(undefined, "preview")).toBeUndefined();
  });

  it("binds protected image URLs to a validated collection revision", () => {
    expect(
      withCardImageCollectionRevision(
        "/api/card-images/588?v=current&variant=thumb",
        59,
      ),
    ).toBe(
      "/api/card-images/588?v=current&variant=thumb&collectionRevision=59",
    );
    expect(
      withCardImageCollectionRevision("https://example.invalid/card.webp", 59),
    ).toBe("https://example.invalid/card.webp");
    expect(
      withCardImageCollectionRevision(
        "/api/card-images/588?v=current",
        undefined,
      ),
    ).toBe("/api/card-images/588?v=current");
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
    expect(source).toContain(
      "onUnavailable={() => setCardImageUnavailable(true)}",
    );
    expect(source).not.toContain('alt={`Kartenbild ${card.title ?? "Karte"}`}');
  });
});
