import { describe, expect, it } from "vitest";
import { localizedDeCardTitle } from "./card-image-manifest";
import { localCardImageUrl } from "./card-image-service";

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
});
