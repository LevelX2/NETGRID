import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { CARD_IMAGE_VARIANT_LIMITS, normalizeCardImage } from "./normalizer";

describe("card image normalization", () => {
  it("creates metadaten-free WebP variants without cropping or upscaling", async () => {
    const source = await sharp({
      create: { width: 609, height: 855, channels: 3, background: "#224466" },
    })
      .withMetadata({ orientation: 1 })
      .png()
      .toBuffer();
    const normalized = await normalizeCardImage(source, "fixture");

    expect(Object.keys(normalized.variants).sort()).toEqual([
      "full",
      "master",
      "preview",
      "thumb",
    ]);
    expect(normalized.variants.master).toMatchObject({
      mediaType: "image/webp",
      width: 609,
      height: 855,
    });
    expect(normalized.variants.full).toMatchObject({ width: 609, height: 855 });
    expect(normalized.variants.preview).toMatchObject({
      width: 480,
      height: 674,
    });
    expect(normalized).toMatchObject({
      sourceMediaType: "image/png",
      sourceWidth: 609,
      sourceHeight: 855,
    });
    expect(normalized.variants.thumb.width).toBeLessThanOrEqual(
      CARD_IMAGE_VARIANT_LIMITS.thumb.width,
    );
    const metadata = await sharp(normalized.variants.master.content).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.exif).toBeUndefined();
  });

  it("applies EXIF orientation before validating the card shape", async () => {
    const source = await sharp({
      create: { width: 855, height: 609, channels: 3, background: "#446688" },
    })
      .withMetadata({ orientation: 6 })
      .jpeg({ quality: 90 })
      .toBuffer();
    const normalized = await normalizeCardImage(source, "rotated");
    expect(normalized).toMatchObject({
      sourceMediaType: "image/jpeg",
      sourceWidth: 855,
      sourceHeight: 609,
    });
    expect(normalized.variants.master).toMatchObject({
      width: 609,
      height: 855,
    });
  });

  it("limits large sources while preserving their aspect ratio", async () => {
    const source = await sharp({
      create: {
        width: 3000,
        height: 4200,
        channels: 3,
        background: "#6688aa",
      },
    })
      .png()
      .toBuffer();
    const normalized = await normalizeCardImage(source, "large");
    expect(normalized.variants.master).toMatchObject({
      width: 2400,
      height: 3360,
    });
    expect(normalized.variants.full).toMatchObject({
      width: 1200,
      height: 1680,
    });
    expect(normalized.variants.preview).toMatchObject({
      width: 480,
      height: 672,
    });
    expect(normalized.variants.thumb).toMatchObject({
      width: 256,
      height: 358,
    });
  });

  it("applies an explicit pixel crop after EXIF orientation", async () => {
    const source = await sharp({
      create: { width: 1050, height: 750, channels: 3, background: "#b6bcbc" },
    })
      .withMetadata({ orientation: 6 })
      .jpeg({ quality: 90 })
      .toBuffer();
    const normalized = await normalizeCardImage(source, "cropped", {
      cropPixels: { left: 40, top: 35, right: 40, bottom: 35 },
    });

    expect(normalized).toMatchObject({
      sourceWidth: 1050,
      sourceHeight: 750,
    });
    expect(normalized.variants.master).toMatchObject({
      width: 670,
      height: 980,
    });
  });

  it("rejects a crop outside the oriented source image", async () => {
    const source = await sharp({
      create: { width: 609, height: 855, channels: 3, background: "#224466" },
    })
      .png()
      .toBuffer();

    await expect(
      normalizeCardImage(source, "invalid-crop", {
        cropPixels: { left: 400, top: 0, right: 400, bottom: 0 },
      }),
    ).rejects.toMatchObject({ code: "source_image_crop_invalid" });
  });

  it("rejects landscape and implausible card ratios", async () => {
    const source = await sharp({
      create: { width: 900, height: 600, channels: 3, background: "#112233" },
    })
      .png()
      .toBuffer();
    await expect(normalizeCardImage(source, "landscape")).rejects.toMatchObject(
      {
        code: "source_image_dimensions_invalid",
      },
    );
  });
});
