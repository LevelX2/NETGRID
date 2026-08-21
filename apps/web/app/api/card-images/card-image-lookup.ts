import path from "node:path";
import {
  CardImageStore,
  type CardImageMediaType,
  type CardImageVariantKind,
  parseCardImageVariant,
  resolveManagedCardImage,
  resolveNetgridCardImageRoot,
  resolveNetgridRepositoryRoot,
} from "@netgrid/card-images/runtime";
import { createRuntimeCardsById } from "@netgrid/catalog";
import {
  GENERATED_CARD_IMAGES,
  localizedDeCardImagePath,
} from "../../card-image-manifest";

const REPO_ROOT = resolveNetgridRepositoryRoot();
const IMAGE_DIR = resolveNetgridCardImageRoot({ repositoryRoot: REPO_ROOT });
const LOCALIZED_DE_IMAGE_DIR = path.join(
  REPO_ROOT,
  "data",
  "card-assets",
  "localized",
  "de",
);
const PERSONAL_CARD_IMAGE_STORE = new CardImageStore();

export type CardImageLookupResult = {
  cardId: string;
  printingId: string;
  kind: "personal" | "generated" | "localized_de";
  relativePath: string;
  absolutePath: string;
  mediaType: CardImageMediaType;
  contentHash?: string;
  variant?: CardImageVariantKind;
  versioned: boolean;
};

export type CardImageLookupOptions = {
  personalStore?: CardImageStore;
};

export async function lookupCardImage(
  cardId: string,
  requestUrl: string,
  options: CardImageLookupOptions = {},
): Promise<CardImageLookupResult | null> {
  const catalogCard = createRuntimeCardsById()[cardId];
  if (catalogCard === undefined) return null;
  const { printingId } = catalogCard;
  const request = safeRequestUrl(requestUrl);
  const variant = parseCardImageVariant(request?.searchParams.get("variant"));
  const personalImage = await resolveManagedCardImage(
    options.personalStore ?? PERSONAL_CARD_IMAGE_STORE,
    printingId,
    variant,
  );
  if (personalImage)
    return {
      cardId,
      printingId,
      kind: "personal",
      relativePath: personalImage.relativePath,
      absolutePath: personalImage.absolutePath,
      mediaType: personalImage.mediaType,
      contentHash: personalImage.blobHash,
      variant: personalImage.variant,
      versioned: false,
    };
  if (request?.searchParams.get("skin") === "de") {
    const localizedPath = localizedDeCardImagePath(printingId);
    if (localizedPath)
      return imageResult(
        cardId,
        printingId,
        "localized_de",
        localizedPath,
        request.searchParams.has("v"),
      );
    return null;
  }

  const generatedPath = GENERATED_CARD_IMAGES[printingId];
  if (!generatedPath) return null;
  return imageResult(
    cardId,
    printingId,
    "generated",
    generatedPath,
    hasVersionParam(requestUrl),
  );
}

export function imageDir(): string {
  return IMAGE_DIR;
}

function imageResult(
  cardId: string,
  printingId: string,
  kind: "generated" | "localized_de",
  relativePath: string,
  versioned: boolean,
): CardImageLookupResult | null {
  if (!isSafeLocalImagePath(relativePath, kind)) return null;
  const baseDir = kind === "localized_de" ? LOCALIZED_DE_IMAGE_DIR : IMAGE_DIR;
  const absolutePath = path.resolve(baseDir, relativePath);
  if (!absolutePath.startsWith(`${baseDir}${path.sep}`)) return null;
  return {
    cardId,
    printingId,
    kind,
    relativePath,
    absolutePath,
    mediaType: "image/png",
    versioned,
  };
}

function hasVersionParam(requestUrl: string): boolean {
  const request = safeRequestUrl(requestUrl);
  return request?.searchParams.has("v") ?? false;
}

function safeRequestUrl(requestUrl: string): URL | null {
  try {
    return new URL(requestUrl);
  } catch {
    return null;
  }
}

function isSafeLocalImagePath(
  value: string | undefined,
  kind: "generated" | "localized_de",
): value is string {
  if (
    !value ||
    !value.endsWith(".png") ||
    value.includes("..") ||
    path.isAbsolute(value)
  )
    return false;
  return kind === "localized_de"
    ? value.startsWith("rendered/full/")
    : value.startsWith("generated-");
}
