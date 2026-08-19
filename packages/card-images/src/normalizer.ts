import { createHash } from "node:crypto";
import sharp from "sharp";
import type {
  CardImageMediaType,
  CardImageVariantKind,
  PutCardImageBlobInput,
} from "./store";

const MAX_INPUT_PIXELS = 100_000_000;
const MIN_WIDTH = 200;
const MIN_HEIGHT = 280;
const MIN_ASPECT_RATIO = 0.58;
const MAX_ASPECT_RATIO = 0.82;

export const CARD_IMAGE_VARIANT_LIMITS = {
  master: { width: 2400, height: 3360 },
  full: { width: 1200, height: 1680 },
  preview: { width: 480, height: 674 },
  thumb: { width: 256, height: 358 },
} as const satisfies Record<
  CardImageVariantKind,
  { width: number; height: number }
>;

export type NormalizedCardImageVariant = PutCardImageBlobInput & {
  kind: CardImageVariantKind;
  content: Buffer;
  mediaType: "image/webp";
  contentHash: string;
};

export type NormalizedCardImage = {
  sourceHash: string;
  sourceMediaType: CardImageMediaType;
  sourceWidth: number;
  sourceHeight: number;
  sourceBytes: number;
  assetHash: string;
  variants: Record<CardImageVariantKind, NormalizedCardImageVariant>;
};

export type CardImageNormalizationErrorCode =
  | "source_image_invalid"
  | "source_image_format_unsupported"
  | "source_image_dimensions_invalid";

export class CardImageNormalizationError extends Error {
  constructor(
    readonly code: CardImageNormalizationErrorCode,
    message: string,
    readonly label?: string,
  ) {
    super(message);
    this.name = "CardImageNormalizationError";
  }
}

export async function normalizeCardImage(
  source: Uint8Array,
  label?: string,
): Promise<NormalizedCardImage> {
  const content = Buffer.from(source);
  const sourceMetadata = await safeMetadata(content, label);
  const sourceMediaType = mediaTypeForFormat(sourceMetadata.format, label);
  const { width: sourceWidth, height: sourceHeight } = sourceDimensions(
    sourceMetadata.width,
    sourceMetadata.height,
    label,
  );
  const master = await renderMaster(content, label);
  validateCardDimensions(master.width, master.height, label);
  const full = await renderDerivative("full", master.content);
  const preview = await renderDerivative("preview", master.content);
  const thumb = await renderDerivative("thumb", master.content);
  return {
    sourceHash: sha256(content),
    sourceMediaType,
    sourceWidth,
    sourceHeight,
    sourceBytes: content.byteLength,
    assetHash: master.contentHash,
    variants: { master, thumb, preview, full },
  };
}

function sourceDimensions(
  width: number | undefined,
  height: number | undefined,
  label?: string,
): { width: number; height: number } {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    (width ?? 0) <= 0 ||
    (height ?? 0) <= 0
  )
    throw invalidImage(label);
  return { width: width!, height: height! };
}

async function renderMaster(
  source: Buffer,
  label?: string,
): Promise<NormalizedCardImageVariant> {
  try {
    const { data, info } = await sharp(source, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize({
        ...CARD_IMAGE_VARIANT_LIMITS.master,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toColorspace("srgb")
      .webp({ lossless: true, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    return normalizedVariant("master", data, info.width, info.height);
  } catch (error) {
    if (error instanceof CardImageNormalizationError) throw error;
    throw invalidImage(label);
  }
}

async function renderDerivative(
  kind: Exclude<CardImageVariantKind, "master">,
  master: Buffer,
): Promise<NormalizedCardImageVariant> {
  const quality = kind === "full" ? 92 : kind === "preview" ? 88 : 84;
  const { data, info } = await sharp(master, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
  })
    .resize({
      ...CARD_IMAGE_VARIANT_LIMITS[kind],
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, smartSubsample: true, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return normalizedVariant(kind, data, info.width, info.height);
}

function normalizedVariant(
  kind: CardImageVariantKind,
  content: Buffer,
  width: number,
  height: number,
): NormalizedCardImageVariant {
  return {
    kind,
    content,
    mediaType: "image/webp",
    width,
    height,
    contentHash: sha256(content),
  };
}

async function safeMetadata(content: Buffer, label?: string) {
  try {
    return await sharp(content, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata();
  } catch {
    throw invalidImage(label);
  }
}

function mediaTypeForFormat(
  format: string | undefined,
  label?: string,
): CardImageMediaType {
  if (format === "png") return "image/png";
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  throw new CardImageNormalizationError(
    "source_image_format_unsupported",
    `Bildformat${label ? ` für ${label}` : ""} wird nicht unterstützt.`,
    label,
  );
}

function validateCardDimensions(
  width: number,
  height: number,
  label?: string,
): void {
  const ratio = width / height;
  if (
    width < MIN_WIDTH ||
    height < MIN_HEIGHT ||
    width >= height ||
    ratio < MIN_ASPECT_RATIO ||
    ratio > MAX_ASPECT_RATIO
  )
    throw new CardImageNormalizationError(
      "source_image_dimensions_invalid",
      `Bild${label ? ` für ${label}` : ""} besitzt nach Ausrichtung keine plausiblen Kartenabmessungen (${width} × ${height}).`,
      label,
    );
}

function invalidImage(label?: string): CardImageNormalizationError {
  return new CardImageNormalizationError(
    "source_image_invalid",
    `Bildquelle${label ? ` für ${label}` : ""} konnte nicht sicher dekodiert werden.`,
    label,
  );
}

function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}
