import { describe, expect, it } from "vitest";
import { lookupCardImage } from "./card-image-lookup";

describe("card image lookup", () => {
  it("resolves registered German display-only skin assets by cardId", async () => {
    const image = await lookupCardImage(
      "onr_v1_188_ai-chief-financial-officer",
      "http://netgrid.local/api/card-images/onr_v1_188_ai-chief-financial-officer?skin=de&v=test",
    );

    expect(image).toMatchObject({
      cardId: "onr_v1_188_ai-chief-financial-officer",
      kind: "localized_de",
      relativePath: "rendered/full/onr_v1_188_ai-chief-financial-officer.png",
      versioned: true,
    });
    expect(image?.absolutePath).toContain("data");
    expect(image?.absolutePath).toContain("card-assets");
  });

  it("does not invent German skin assets for cards outside the localized registry", async () => {
    await expect(
      lookupCardImage("onr_v1_001_afreet", "http://netgrid.local/api/card-images/onr_v1_001_afreet?skin=de&v=test"),
    ).resolves.toBeNull();
  });
});
