import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRuntimeCardsById } from "@netgrid/catalog";
import {
  GENERATED_CARD_IMAGES,
  localizedDeCardImagePath,
} from "../../card-image-manifest";

const REPO_ROOT = resolveRepoRoot();
const IMAGE_DIR = path.join(REPO_ROOT, "data", "local-assets", "card-images");
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

export type CardImageLookupResult = {
  cardId: string;
  kind: "generated" | "local_onr" | "localized_de";
  relativePath: string;
  absolutePath: string;
  versioned: boolean;
};

export async function lookupCardImage(
  cardId: string,
  requestUrl: string,
): Promise<CardImageLookupResult | null> {
  const request = safeRequestUrl(requestUrl);
  if (request?.searchParams.get("skin") === "de") {
    const localizedPath = localizedDeCardImagePath(cardId);
    if (localizedPath)
      return imageResult(
        cardId,
        "localized_de",
        localizedPath,
        request.searchParams.has("v"),
      );
    return null;
  }

  const generatedPath = GENERATED_CARD_IMAGES[cardId];
  if (generatedPath)
    return imageResult(
      cardId,
      "generated",
      generatedPath,
      hasVersionParam(requestUrl),
    );
  if (!isLocalOnrCatalogCardId(cardId)) return null;

  const localPath = (await localOnrImageLookup()).get(cardId);
  if (!localPath) return null;
  return imageResult(cardId, "local_onr", localPath, false);
}

export function imageDir(): string {
  return IMAGE_DIR;
}

function imageResult(
  cardId: string,
  kind: CardImageLookupResult["kind"],
  relativePath: string,
  versioned: boolean,
): CardImageLookupResult | null {
  if (!isSafeLocalImagePath(relativePath, kind)) return null;
  const baseDir = imageBaseDir(kind);
  const absolutePath = path.resolve(baseDir, relativePath);
  if (!absolutePath.startsWith(`${baseDir}${path.sep}`)) return null;
  return { cardId, kind, relativePath, absolutePath, versioned };
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
  await addLocalOnrV1SnapshotImages(lookup);
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
): Promise<void> {
  try {
    const snapshot = JSON.parse(
      await readFile(LOCAL_ONR_SNAPSHOT_PATH, "utf8"),
    ) as LocalOnrSnapshot;
    for (const card of snapshot.cards) {
      const relativePath = card.onr?.imageAsset?.relativePath;
      if (isSafeLocalImagePath(relativePath, "local_onr"))
        lookup.set(card.catalogCardId, relativePath);
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
  if (kind === "local_onr") return value.startsWith("onr-1996/");
  if (kind === "localized_de") return value.startsWith("rendered/full/");
  return value.startsWith("generated-");
}

function imageBaseDir(kind: CardImageLookupResult["kind"]): string {
  return kind === "localized_de" ? LOCALIZED_DE_IMAGE_DIR : IMAGE_DIR;
}

function isLocalOnrCatalogCardId(cardId: string): boolean {
  return (
    cardId.startsWith("onr_v1_") ||
    cardId.startsWith("onr_proteus_") ||
    cardId.startsWith("onr_classic_")
  );
}

async function addLocalOnrSetIndexImages(
  lookup: Map<string, string>,
  catalogCards: readonly {
    catalogCardId: string;
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
      `${card.side}:${slugFromOnrCardId(card.catalogCardId)}`,
    );
    if (
      titleAsset !== undefined &&
      slugAsset !== undefined &&
      titleAsset.relativePath !== slugAsset.relativePath
    )
      throw new CardImageCatalogJoinError(
        "conflicting_asset_match",
        card.catalogCardId,
      );
    const asset = titleAsset ?? slugAsset;
    if (asset !== undefined)
      matched.set(card.catalogCardId, asset.relativePath);
  }
  return matched;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function titleKey(side: string, title: string): string {
  return `${side}:${title.trim().toLocaleLowerCase("en-US")}`;
}

function slugFromOnrCardId(cardId: string): string {
  return cardId.replace(/^onr_(?:proteus|classic)_\d{3}_/, "");
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

function resolveRepoRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), "..", "..")];
  return (
    candidates.find((candidate) =>
      existsSync(path.join(candidate, "data", "card-import")),
    ) ?? process.cwd()
  );
}
