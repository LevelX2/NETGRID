import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { GENERATED_CARD_IMAGES } from "../../card-image-manifest";

const REPO_ROOT = resolveRepoRoot();
const IMAGE_DIR = path.join(REPO_ROOT, "data", "local-assets", "card-images");
const LOCAL_ONR_SNAPSHOT_PATH = path.join(REPO_ROOT, "data", "local", "card-import", "onr-v1-limited", "card-snapshot-onr-v1-limited.local.json");

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
  if (!cardId.startsWith("onr_v1_")) return null;

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
  try {
    const snapshot = JSON.parse(await readFile(LOCAL_ONR_SNAPSHOT_PATH, "utf8")) as LocalOnrSnapshot;
    const lookup = new Map<string, string>();
    for (const card of snapshot.cards) {
      const relativePath = card.onr?.imageAsset?.relativePath;
      if (isSafeLocalImagePath(relativePath, "local_onr")) lookup.set(card.catalogCardId, relativePath);
    }
    return lookup;
  } catch {
    return new Map();
  }
}

function isSafeLocalImagePath(value: string | undefined, kind: CardImageLookupResult["kind"]): value is string {
  if (!value || !value.endsWith(".png") || value.includes("..") || path.isAbsolute(value)) return false;
  if (kind === "local_onr") return value.startsWith("onr-1996/");
  return value.startsWith("generated-");
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

function resolveRepoRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), "..", "..")];
  return candidates.find((candidate) => existsSync(path.join(candidate, "data", "card-import"))) ?? process.cwd();
}
