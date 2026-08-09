import { describe, expect, it } from "vitest";
import {
  CardImageCatalogJoinError,
  lookupCardImage,
  matchCatalogCardsToLocalAssets,
} from "./card-image-lookup";

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
      lookupCardImage(
        "onr_v1_001_afreet",
        "http://netgrid.local/api/card-images/onr_v1_001_afreet?skin=de&v=test",
      ),
    ).resolves.toBeNull();
  });

  it("joins migrated Proteus cards to local assets through the composed catalog", () => {
    const cards = [
      {
        catalogCardId: "onr_proteus_020_digiconda",
        title: "Digiconda",
        side: "corp",
      },
      {
        catalogCardId: "onr_proteus_080_black-widow",
        title: "Black Widow",
        side: "runner",
      },
      {
        catalogCardId: "onr_proteus_092_morphing-tool",
        title: "Morphing Tool",
        side: "runner",
      },
    ];
    const assets = cards.map((card) => ({
      title: card.title,
      slug: card.catalogCardId.replace(/^onr_proteus_\d{3}_/, ""),
      set: "v21-proteus",
      side: card.side,
      relativePath: `onr-1996/${card.catalogCardId}.png`,
    }));

    expect(
      Object.fromEntries(
        matchCatalogCardsToLocalAssets(cards, assets, "v21-proteus"),
      ),
    ).toEqual({
      onr_proteus_020_digiconda: "onr-1996/onr_proteus_020_digiconda.png",
      "onr_proteus_080_black-widow": "onr-1996/onr_proteus_080_black-widow.png",
      "onr_proteus_092_morphing-tool":
        "onr-1996/onr_proteus_092_morphing-tool.png",
    });
  });

  it("fails closed for ambiguous or unsafe local asset joins", () => {
    const card = {
      catalogCardId: "onr_proteus_020_digiconda",
      title: "Digiconda",
      side: "corp",
    };
    const baseAsset = {
      title: "Digiconda",
      slug: "different-slug",
      set: "v21-proteus",
      side: "corp",
      relativePath: "onr-1996/digiconda-title.png",
    };

    expect(() =>
      matchCatalogCardsToLocalAssets(
        [card],
        [
          baseAsset,
          {
            ...baseAsset,
            title: "Different title",
            slug: "digiconda",
            relativePath: "onr-1996/digiconda-slug.png",
          },
        ],
        "v21-proteus",
      ),
    ).toThrowError(CardImageCatalogJoinError);
    expect(() =>
      matchCatalogCardsToLocalAssets(
        [card],
        [{ ...baseAsset, relativePath: "../escape.png" }],
        "v21-proteus",
      ),
    ).toThrowError(CardImageCatalogJoinError);
  });
});
