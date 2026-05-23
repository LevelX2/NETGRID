import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { GENERATED_CARD_IMAGES } from "../../card-image-manifest";

const REPO_ROOT = resolveRepoRoot();
const IMAGE_DIR = path.join(REPO_ROOT, "data", "local-assets", "card-images");
const LOCAL_ONR_SNAPSHOT_PATH = path.join(REPO_ROOT, "data", "local", "card-import", "onr-v1-limited", "card-snapshot-onr-v1-limited.local.json");
const LOCAL_ONR_ASSET_INDEX_PATH = path.join(IMAGE_DIR, "onr-1996", "card-image-index.local.json");
const PROTEUS_CARD_SET_PATH = path.join(REPO_ROOT, "data", "cards", "proteus-cards.json");

let localOnrImageLookupPromise: Promise<Map<string, string>> | null = null;

export type CardImageLookupResult = {
  cardId: string;
  kind: "generated" | "local_onr";
  relativePath: string;
  absolutePath: string;
  versioned: boolean;
};

export async function lookupCardImage(cardId: string, requestUrl: string): Promise<CardImageLookupResult | null> {
  const generatedPath = GENERATED_CARD_IMAGES[cardId];
  if (generatedPath) return imageResult(cardId, "generated", generatedPath, hasVersionParam(requestUrl));
  if (!isLocalOnrCatalogCardId(cardId)) return null;

  const localPath = (await localOnrImageLookup()).get(cardId);
  if (!localPath) return null;
  return imageResult(cardId, "local_onr", localPath, false);
}

export function imageDir(): string {
  return IMAGE_DIR;
}

function imageResult(cardId: string, kind: CardImageLookupResult["kind"], relativePath: string, versioned: boolean): CardImageLookupResult | null {
  if (!isSafeLocalImagePath(relativePath, kind)) return null;
  const absolutePath = path.resolve(IMAGE_DIR, relativePath);
  if (!absolutePath.startsWith(`${IMAGE_DIR}${path.sep}`)) return null;
  return { cardId, kind, relativePath, absolutePath, versioned };
}

function hasVersionParam(requestUrl: string): boolean {
  try {
    return new URL(requestUrl).searchParams.has("v");
  } catch {
    return false;
  }
}

async function localOnrImageLookup(): Promise<Map<string, string>> {
  localOnrImageLookupPromise ??= readLocalOnrImageLookup();
  return localOnrImageLookupPromise;
}

async function readLocalOnrImageLookup(): Promise<Map<string, string>> {
  const lookup = new Map<string, string>();
  await addLocalOnrV1SnapshotImages(lookup);
  await addProteusLocalIndexImages(lookup);
  return lookup;
}

async function addLocalOnrV1SnapshotImages(lookup: Map<string, string>): Promise<void> {
  try {
    const snapshot = JSON.parse(await readFile(LOCAL_ONR_SNAPSHOT_PATH, "utf8")) as LocalOnrSnapshot;
    for (const card of snapshot.cards) {
      const relativePath = card.onr?.imageAsset?.relativePath;
      if (isSafeLocalImagePath(relativePath, "local_onr")) lookup.set(card.catalogCardId, relativePath);
    }
  } catch {
    // Private local image data is optional. Missing local files simply mean no image.
  }
}

function isSafeLocalImagePath(value: string | undefined, kind: CardImageLookupResult["kind"]): value is string {
  if (!value || !value.endsWith(".png") || value.includes("..") || path.isAbsolute(value)) return false;
  if (kind === "local_onr") return value.startsWith("onr-1996/");
  return value.startsWith("generated-");
}

function isLocalOnrCatalogCardId(cardId: string): boolean {
  return cardId.startsWith("onr_v1_") || cardId.startsWith("onr_proteus_");
}

async function addProteusLocalIndexImages(lookup: Map<string, string>): Promise<void> {
  try {
    const [assetIndex, proteusSet] = await Promise.all([
      readJson<LocalOnrAssetIndex>(LOCAL_ONR_ASSET_INDEX_PATH),
      readJson<ProteusCardSet>(PROTEUS_CARD_SET_PATH),
    ]);
    const assetsByTitle = new Map<string, LocalOnrAsset>();
    const assetsBySlug = new Map<string, LocalOnrAsset>();
    for (const asset of assetIndex.assets) {
      if (asset.set !== "v21-proteus" || !isSafeLocalImagePath(asset.relativePath, "local_onr")) continue;
      assetsByTitle.set(titleKey(asset.side, asset.title), asset);
      assetsBySlug.set(`${asset.side}:${asset.slug}`, asset);
    }

    for (const card of proteusSet.cards) {
      const titleAsset = assetsByTitle.get(titleKey(card.side, card.title));
      const slugAsset = assetsBySlug.get(`${card.side}:${proteusSlugFromCardId(card.cardId)}`);
      const asset = titleAsset ?? slugAsset;
      if (asset && isSafeLocalImagePath(asset.relativePath, "local_onr")) lookup.set(card.cardId, asset.relativePath);
    }
  } catch {
    // The Proteus image cache is private/local and ignored by git.
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function titleKey(side: string, title: string): string {
  return `${side}:${title.trim().toLocaleLowerCase("en-US")}`;
}

function proteusSlugFromCardId(cardId: string): string {
  return cardId.replace(/^onr_proteus_\d{3}_/, "");
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

type LocalOnrAsset = {
  title: string;
  slug: string;
  set: string;
  side: string;
  relativePath: string;
};

type ProteusCardSet = {
  cards: Array<{
    cardId: string;
    title: string;
    side: string;
  }>;
};

function resolveRepoRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), "..", "..")];
  return candidates.find((candidate) => existsSync(path.join(candidate, "data", "card-import"))) ?? process.cwd();
}
