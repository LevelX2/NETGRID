import { describe, expect, it } from "vitest";
import { localCardImageUrl } from "./card-image-service";

describe("card image client service", () => {
  it("keeps generated image URLs versioned and local O:NR URLs unversioned", () => {
    expect(localCardImageUrl("simple_agenda")).toBe("/api/card-images/simple_agenda?v=2026-05-04-generated-card-art-1");
    expect(localCardImageUrl("onr_v1_001_afreet")).toBe("/api/card-images/onr_v1_001_afreet");
    expect(localCardImageUrl("onr_proteus_071_raymond-ellison")).toBe("/api/card-images/onr_proteus_071_raymond-ellison");
  });

  it("does not mint image URLs for hidden or unsupported identifiers", () => {
    expect(localCardImageUrl(undefined)).toBeUndefined();
    expect(localCardImageUrl("hidden-card")).toBeUndefined();
    expect(localCardImageUrl("netgrid-corp-back")).toBeUndefined();
  });
});
