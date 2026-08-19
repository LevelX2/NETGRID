import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CardImageStore,
  type CardImageMediaType,
  type CardImageVariantKind,
  parseCardImageVariant,
  resolveManagedCardImage,
  resolveNetgridCardImageRoot,
  resolveNetgridRepositoryRoot,
} from "@netgrid/card-images";
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
const LOCAL_ONR_SNAPSHOT_PATH = path.join(
  REPO_ROOT,
  "data",
  "local",
  "card-import",
  "onr-v1-limited",
  "card-snapshot-onr-v1-limited.local.json",
);
const LOCAL_ONR_ASSET_INDEX_PATH = path.join(
  IMAGE_DIR,
  "onr-1996",
  "card-image-index.local.json",
);
const PERSONAL_CARD_IMAGE_STORE = new CardImageStore();

export type CardImageLookupResult = {
  cardId: string;
  printingId: string;
  kind: "personal" | "generated" | "local_onr" | "localized_de";
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
  if (generatedPath)
    return imageResult(
      cardId,
      printingId,
      "generated",
      generatedPath,
      hasVersionParam(requestUrl),
    );
  if (!isLocalOnrPrintingId(printingId)) return null;

  const localPath = (await localOnrImageLookup()).get(printingId);
  if (!localPath) return null;
  return imageResult(cardId, printingId, "local_onr", localPath, false);
}

export function imageDir(): string {
  return IMAGE_DIR;
}

function imageResult(
  cardId: string,
  printingId: string,
  kind: CardImageLookupResult["kind"],
  relativePath: string,
  versioned: boolean,
): CardImageLookupResult | null {
  if (!isSafeLocalImagePath(relativePath, kind)) return null;
  const baseDir = imageBaseDir(kind);
  const absolutePath = path.resolve(baseDir, relativePath);
  if (!absolutePath.startsWith(`${baseDir}${path.sep}`)) return null;
  return { cardId, printingId, kind, relativePath, absolutePath, mediaType: "image/png", versioned };
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

async function localOnrImageLookup(): Promise<Map<string, string>> {
  return readLocalOnrImageLookup();
}

async function readLocalOnrImageLookup(): Promise<Map<string, string>> {
  const lookup = new Map<string, string>();
  const catalogCards = Object.values(createRuntimeCardsById());
  await addLocalOnrV1SnapshotImages(lookup, catalogCards);
  await addLocalOnrSetIndexImages(
    lookup,
    catalogCards,
    "v21-proteus",
    "proteus",
  );
  await addLocalOnrSetIndexImages(
    lookup,
    catalogCards,
    "v22-classic",
    "classic",
  );
  await addLocalOnrSetIndexImages(
    lookup,
    catalogCards,
    "v22b-silent-impact",
    "classic",
  );
  return lookup;
}

async function addLocalOnrV1SnapshotImages(
  lookup: Map<string, string>,
  catalogCards: readonly {
    catalogCardId: string;
    printingId: string;
  }[],
): Promise<void> {
  try {
    const snapshot = JSON.parse(
      await readFile(LOCAL_ONR_SNAPSHOT_PATH, "utf8"),
    ) as LocalOnrSnapshot;
    const printingIdByCardId = new Map(
      catalogCards.map((card) => [card.catalogCardId, card.printingId]),
    );
    for (const card of snapshot.cards) {
      const relativePath = card.onr?.imageAsset?.relativePath;
      const printingId = printingIdByCardId.get(card.catalogCardId);
      if (
        printingId !== undefined &&
        isSafeLocalImagePath(relativePath, "local_onr")
      )
        lookup.set(printingId, relativePath);
    }
  } catch (error) {
    if (!isOptionalLocalAssetReadFailure(error)) throw error;
  }
}

function isSafeLocalImagePath(
  value: string | undefined,
  kind: CardImageLookupResult["kind"],
): value is string {
  if (
    !value ||
    !value.endsWith(".png") ||
    value.includes("..") ||
    path.isAbsolute(value)
  )
    return false;
  if (kind === "personal") return false;
  if (kind === "local_onr") return value.startsWith("onr-1996/");
  if (kind === "localized_de") return value.startsWith("rendered/full/");
  return value.startsWith("generated-");
}

function imageBaseDir(kind: CardImageLookupResult["kind"]): string {
  if (kind === "personal") return IMAGE_DIR;
  return kind === "localized_de" ? LOCALIZED_DE_IMAGE_DIR : IMAGE_DIR;
}

function isLocalOnrPrintingId(printingId: string): boolean {
  return (
    printingId.startsWith("onr_v1_") ||
    printingId.startsWith("onr_proteus_") ||
    printingId.startsWith("onr_classic_")
  );
}

async function addLocalOnrSetIndexImages(
  lookup: Map<string, string>,
  catalogCards: readonly {
    catalogCardId: string;
    printingId: string;
    title: string;
    side: string;
    setId: string;
  }[],
  imageSet: string,
  catalogSetId: string,
): Promise<void> {
  try {
    const assetIndex = await readJson<LocalOnrAssetIndex>(
      LOCAL_ONR_ASSET_INDEX_PATH,
    );
    const matched = matchCatalogCardsToLocalAssets(
      catalogCards.filter((candidate) => candidate.setId === catalogSetId),
      assetIndex.assets,
      imageSet,
    );
    for (const [cardId, relativePath] of matched)
      lookup.set(cardId, relativePath);
  } catch (error) {
    if (!isOptionalLocalAssetReadFailure(error)) throw error;
  }
}

function isOptionalLocalAssetReadFailure(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

export type CardImageCatalogJoinErrorCode =
  | "invalid_asset_path"
  | "duplicate_asset_identity"
  | "conflicting_asset_match";

export class CardImageCatalogJoinError extends Error {
  constructor(
    readonly code: CardImageCatalogJoinErrorCode,
    readonly identity: string,
  ) {
    super(`${code}: ${identity}`);
    this.name = "CardImageCatalogJoinError";
  }
}

export function matchCatalogCardsToLocalAssets(
  cards: readonly {
    catalogCardId: string;
    printingId: string;
    title: string;
    side: string;
  }[],
  assets: readonly LocalOnrAsset[],
  imageSet: string,
): ReadonlyMap<string, string> {
  const assetsByTitle = new Map<string, LocalOnrAsset>();
  const assetsBySlug = new Map<string, LocalOnrAsset>();
  for (const asset of assets) {
    if (asset.set !== imageSet) continue;
    if (!isSafeLocalImagePath(asset.relativePath, "local_onr"))
      throw new CardImageCatalogJoinError(
        "invalid_asset_path",
        asset.relativePath,
      );
    const titleIdentity = titleKey(asset.side, asset.title);
    const slugIdentity = `${asset.side}:${asset.slug}`;
    const priorTitle = assetsByTitle.get(titleIdentity);
    const priorSlug = assetsBySlug.get(slugIdentity);
    if (
      (priorTitle !== undefined &&
        priorTitle.relativePath !== asset.relativePath) ||
      (priorSlug !== undefined && priorSlug.relativePath !== asset.relativePath)
    )
      throw new CardImageCatalogJoinError(
        "duplicate_asset_identity",
        `${titleIdentity}|${slugIdentity}`,
      );
    assetsByTitle.set(titleIdentity, asset);
    assetsBySlug.set(slugIdentity, asset);
  }

  const matched = new Map<string, string>();
  for (const card of cards) {
    const titleAsset = assetsByTitle.get(titleKey(card.side, card.title));
    const slugAsset = assetsBySlug.get(
      `${card.side}:${slugFromOnrPrintingId(card.printingId)}`,
    );
    if (
      titleAsset !== undefined &&
      slugAsset !== undefined &&
      titleAsset.relativePath !== slugAsset.relativePath
    )
      throw new CardImageCatalogJoinError(
        "conflicting_asset_match",
        card.printingId,
      );
    const asset = titleAsset ?? slugAsset;
    if (asset !== undefined)
      matched.set(card.printingId, asset.relativePath);
  }
  return matched;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function titleKey(side: string, title: string): string {
  return `${side}:${title.trim().toLocaleLowerCase("en-US")}`;
}

function slugFromOnrPrintingId(printingId: string): string {
  return printingId.replace(/^onr_(?:proteus|classic)_\d{3}_/, "");
}

type LocalOnrSnapshot = {
  cards: Array<{
    catalogCardId: string;
    onr?: {
      imageAsset?: {
        relativePath?: string;
      };
    };
  }>;
};

type LocalOnrAssetIndex = {
  assets: LocalOnrAsset[];
};

export type LocalOnrAsset = {
  title: string;
  slug: string;
  set: string;
  side: string;
  relativePath: string;
};
