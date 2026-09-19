import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { CardImageStore } from "@netgrid/card-images/runtime";
import { createRuntimeCardsById } from "@netgrid/catalog";
import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupCardImage } from "./card-image-lookup";

vi.mock("@netgrid/catalog", async (importOriginal) => {
  const catalog = await importOriginal<typeof import("@netgrid/catalog")>();
  return {
    ...catalog,
    createRuntimeCardsById: vi.fn(catalog.createRuntimeCardsById),
  };
});

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("card image lookup", () => {
  it("reuses catalog identities across concurrent thumbnail and preview requests", async () => {
    const personalStore = new CardImageStore({ root: await temporaryRoot() });
    const images = await Promise.all(
      ["thumb", "preview", "thumb"].map((variant) =>
        lookupCardImage(
          "onr_v1_188_ai-chief-financial-officer",
          `http://netgrid.local/api/card-images/onr_v1_188_ai-chief-financial-officer?skin=de&variant=${variant}`,
          { personalStore },
        ),
      ),
    );
    expect(images.every((image) => image?.kind === "localized_de")).toBe(true);
    expect(createRuntimeCardsById).toHaveBeenCalledTimes(1);
    await expect(
      lookupCardImage("toString", "http://netgrid.local", { personalStore }),
    ).resolves.toBeNull();
  });

  it("resolves registered German display-only skin assets through printingId", async () => {
    const root = await temporaryRoot();
    const image = await lookupCardImage(
      "onr_v1_188_ai-chief-financial-officer",
      "http://netgrid.local/api/card-images/onr_v1_188_ai-chief-financial-officer?skin=de&v=test",
      { personalStore: new CardImageStore({ root }) },
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
    const root = await temporaryRoot();
    await expect(
      lookupCardImage(
        "onr_v1_001_afreet",
        "http://netgrid.local/api/card-images/onr_v1_001_afreet?skin=de&v=test",
        { personalStore: new CardImageStore({ root }) },
      ),
    ).resolves.toBeNull();
  });

  it("resolves a personal variant before localized and generated images after restart", async () => {
    const root = await temporaryRoot();
    const writer = new CardImageStore({ root });
    const asset = await writer.putAssetVariants({
      variants: [
        imageVariant("master"),
        imageVariant("thumb"),
        imageVariant("preview"),
        imageVariant("full"),
      ],
    });
    await writer.applyBindings("personal", [
      {
        printingId: "onr_v1_188_ai-chief-financial-officer",
        assetHash: asset.assetHash,
      },
    ]);

    const image = await lookupCardImage(
      "onr_v1_188_ai-chief-financial-officer",
      "http://netgrid.local/api/card-images/onr_v1_188_ai-chief-financial-officer?skin=de&variant=preview&collectionRevision=1",
      { personalStore: new CardImageStore({ root }) },
    );

    expect(image).toMatchObject({
      kind: "personal",
      printingId: "onr_v1_188_ai-chief-financial-officer",
      mediaType: "image/webp",
      contentHash: asset.variants.preview?.blobHash,
      variant: "preview",
      collectionRevision: 1,
      versioned: true,
    });
  });

  it("does not mark a stale personal collection revision immutable", async () => {
    const root = await temporaryRoot();
    const store = new CardImageStore({ root });
    const asset = await store.putAssetVariants({
      variants: [imageVariant("master"), imageVariant("thumb")],
    });
    await store.applyBindings("personal", [
      {
        printingId: "onr_v1_188_ai-chief-financial-officer",
        assetHash: asset.assetHash,
      },
    ]);

    await expect(
      lookupCardImage(
        "onr_v1_188_ai-chief-financial-officer",
        "http://netgrid.local/api/card-images/onr_v1_188_ai-chief-financial-officer?variant=thumb&collectionRevision=0",
        { personalStore: store },
      ),
    ).resolves.toMatchObject({
      kind: "personal",
      collectionRevision: 1,
      versioned: false,
    });
  });

  it("restores the previous image source after removing a personal binding", async () => {
    const root = await temporaryRoot();
    const store = new CardImageStore({ root });
    const asset = await store.putAssetVariants({
      variants: [imageVariant("master"), imageVariant("full")],
    });
    await store.applyBindings("personal", [
      { printingId: "simple_agenda", assetHash: asset.assetHash },
    ]);
    await store.removeBinding("personal", "simple_agenda");

    await expect(
      lookupCardImage(
        "simple_agenda",
        "http://netgrid.local/api/card-images/simple_agenda",
        {
          personalStore: new CardImageStore({ root }),
        },
      ),
    ).resolves.toMatchObject({ kind: "generated", mediaType: "image/png" });
  });

  it("does not use the retired direct ONR directory without a personal binding", async () => {
    const root = await temporaryRoot();

    await expect(
      lookupCardImage(
        "onr_v1_001_afreet",
        "http://netgrid.local/api/card-images/onr_v1_001_afreet",
        { personalStore: new CardImageStore({ root }) },
      ),
    ).resolves.toBeNull();
  });
});

function imageVariant(kind: "master" | "thumb" | "preview" | "full") {
  return {
    kind,
    content: Buffer.from(`personal-${kind}`),
    mediaType: "image/webp" as const,
    width: 100,
    height: 140,
  };
}

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "netgrid-card-lookup-"));
  temporaryRoots.push(root);
  return root;
}
