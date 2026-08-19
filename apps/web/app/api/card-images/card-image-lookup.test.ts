import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { CardImageStore } from "@netgrid/card-images";
import { afterEach, describe, expect, it } from "vitest";
import {
  CardImageCatalogJoinError,
  lookupCardImage,
  matchCatalogCardsToLocalAssets,
} from "./card-image-lookup";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("card image lookup", () => {
  it("resolves registered German display-only skin assets through printingId", async () => {
    const image = await lookupCardImage(
      "onr_v1_188_ai-chief-financial-officer",
      "http://netgrid.local/api/card-images/onr_v1_188_ai-chief-financial-officer?skin=de&v=test",
    );

    expect(image).toMatchObject({
      cardId: "onr_v1_188_ai-chief-financial-officer",
      printingId: "onr_v1_188_ai-chief-financial-officer",
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

  it("resolves a personal variant before localized and generated images after restart", async () => {
    const root = await temporaryRoot();
    const writer = new CardImageStore({ root });
    const asset = await writer.putAssetVariants({
      variants: [imageVariant("master"), imageVariant("thumb"), imageVariant("preview"), imageVariant("full")],
    });
    await writer.applyBindings("personal", [{ printingId: "onr_v1_188_ai-chief-financial-officer", assetHash: asset.assetHash }]);

    const image = await lookupCardImage(
      "onr_v1_188_ai-chief-financial-officer",
      "http://netgrid.local/api/card-images/onr_v1_188_ai-chief-financial-officer?skin=de&variant=preview",
      { personalStore: new CardImageStore({ root }) },
    );

    expect(image).toMatchObject({
      kind: "personal",
      printingId: "onr_v1_188_ai-chief-financial-officer",
      mediaType: "image/webp",
      contentHash: asset.variants.preview?.blobHash,
      variant: "preview",
      versioned: false,
    });
  });

  it("restores the previous image source after removing a personal binding", async () => {
    const root = await temporaryRoot();
    const store = new CardImageStore({ root });
    const asset = await store.putAssetVariants({ variants: [imageVariant("master"), imageVariant("full")] });
    await store.applyBindings("personal", [{ printingId: "simple_agenda", assetHash: asset.assetHash }]);
    await store.removeBinding("personal", "simple_agenda");

    await expect(
      lookupCardImage("simple_agenda", "http://netgrid.local/api/card-images/simple_agenda", {
        personalStore: new CardImageStore({ root }),
      }),
    ).resolves.toMatchObject({ kind: "generated", mediaType: "image/png" });
  });

  it("joins migrated Proteus cards to local assets through the composed catalog", () => {
    const cards = [
      {
        catalogCardId: "definition_digiconda",
        printingId: "onr_proteus_020_digiconda",
        title: "Digiconda",
        side: "corp",
      },
      {
        catalogCardId: "onr_proteus_080_black-widow",
        printingId: "onr_proteus_080_black-widow",
        title: "Black Widow",
        side: "runner",
      },
      {
        catalogCardId: "onr_proteus_092_morphing-tool",
        printingId: "onr_proteus_092_morphing-tool",
        title: "Morphing Tool",
        side: "runner",
      },
    ];
    const assets = cards.map((card) => ({
      title: card.title,
      slug: card.printingId.replace(/^onr_proteus_\d{3}_/, ""),
      set: "v21-proteus",
      side: card.side,
      relativePath: `onr-1996/${card.printingId}.png`,
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
      printingId: "onr_proteus_020_digiconda",
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

function imageVariant(kind: "master" | "thumb" | "preview" | "full") {
  return { kind, content: Buffer.from(`personal-${kind}`), mediaType: "image/webp" as const, width: 100, height: 140 };
}

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "netgrid-card-lookup-"));
  temporaryRoots.push(root);
  return root;
}
