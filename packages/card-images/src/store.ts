import { createHash, randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { resolveNetgridManagedCardImageRoot } from "./paths";

export const CARD_IMAGE_STORE_SCHEMA_VERSION = "card-image-store-v1";
export const CARD_IMAGE_COLLECTION_SCHEMA_VERSION = "card-image-collection-v1";

export type CardImageMediaType = "image/png" | "image/jpeg" | "image/webp";
export type CardImageVariantKind = "master" | "thumb" | "preview" | "full";
export type CardImageBindingConflictMode = "fail" | "skip" | "replace";
export type CardImageBindingResultStatus =
  | "bound"
  | "replaced"
  | "skipped"
  | "unchanged";

export type StoredCardImageVariant = {
  kind: CardImageVariantKind;
  blobHash: string;
  relativePath: string;
  mediaType: CardImageMediaType;
  width: number;
  height: number;
  bytes: number;
};

export type StoredCardImageAsset = {
  schemaVersion: typeof CARD_IMAGE_STORE_SCHEMA_VERSION;
  assetHash: string;
  createdAt: string;
  variants: Partial<Record<CardImageVariantKind, StoredCardImageVariant>>;
};

export type CardImageBinding = {
  printingId: string;
  assetHash: string;
  updatedAt: string;
};

export type CardImageCollectionManifest = {
  schemaVersion: typeof CARD_IMAGE_COLLECTION_SCHEMA_VERSION;
  collectionId: string;
  revision: number;
  bindings: Record<string, CardImageBinding>;
};

export type CardImageBindingChange = {
  printingId: string;
  assetHash: string;
};

export type CardImageBindingResult = CardImageBindingChange & {
  status: CardImageBindingResultStatus;
  previousAssetHash?: string;
};

export type PutCardImageBlobInput = {
  content: Uint8Array;
  mediaType: CardImageMediaType;
  width: number;
  height: number;
  kind?: CardImageVariantKind;
};

export type PutCardImageAssetInput = {
  variants: readonly PutCardImageBlobInput[];
};

export type CardImageStoreErrorCode =
  | "invalid_collection_id"
  | "invalid_printing_id"
  | "invalid_asset_hash"
  | "invalid_image_dimensions"
  | "invalid_image_content"
  | "asset_not_found"
  | "asset_manifest_invalid"
  | "asset_blob_missing"
  | "asset_blob_corrupt"
  | "binding_exists"
  | "duplicate_binding_change"
  | "collection_manifest_invalid";

export class CardImageStoreError extends Error {
  constructor(
    readonly code: CardImageStoreErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CardImageStoreError";
  }
}

export type CardImageStoreOptions = {
  root?: string;
  now?: () => Date;
};

export class CardImageStore {
  readonly root: string;
  private readonly now: () => Date;

  constructor(options: CardImageStoreOptions = {}) {
    this.root = path.resolve(
      options.root ?? resolveNetgridManagedCardImageRoot(),
    );
    this.now = options.now ?? (() => new Date());
  }

  async putMasterAsset(
    input: PutCardImageBlobInput,
  ): Promise<StoredCardImageAsset> {
    return this.putAssetVariants({ variants: [{ ...input, kind: "master" }] });
  }

  async putAssetVariants(
    input: PutCardImageAssetInput,
  ): Promise<StoredCardImageAsset> {
    const variants: StoredCardImageAsset["variants"] = {};
    for (const candidate of input.variants) {
      const variant = await this.putBlob(candidate);
      if (variants[variant.kind])
        throw new CardImageStoreError(
          "asset_manifest_invalid",
          `Kartenbild-Asset enthält Variante ${variant.kind} mehrfach.`,
        );
      variants[variant.kind] = variant;
    }
    const master = variants.master;
    if (!master)
      throw new CardImageStoreError(
        "asset_manifest_invalid",
        "Kartenbild-Asset benötigt eine Master-Variante.",
      );
    const existing = await this.readAssetIfPresent(master.blobHash);
    const asset: StoredCardImageAsset = {
      schemaVersion: CARD_IMAGE_STORE_SCHEMA_VERSION,
      assetHash: master.blobHash,
      createdAt: existing?.createdAt ?? this.now().toISOString(),
      variants: { ...existing?.variants, ...variants },
    };
    await this.writeJsonAtomically(
      this.assetManifestPath(asset.assetHash),
      asset,
    );
    return asset;
  }

  async putBlob(input: PutCardImageBlobInput): Promise<StoredCardImageVariant> {
    validateImageDimensions(input.width, input.height);
    if (input.content.byteLength === 0)
      throw new CardImageStoreError(
        "invalid_image_content",
        "Ein Kartenbild darf nicht leer sein.",
      );
    const kind = input.kind ?? "master";
    const content = Buffer.from(input.content);
    const blobHash = sha256(content);
    const relativePath = blobRelativePath(blobHash, input.mediaType);
    const target = path.join(this.root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    if (await fileExists(target)) await verifyExistingBlob(target, blobHash);
    else await this.writeFileAtomically(target, content);
    return {
      kind,
      blobHash,
      relativePath,
      mediaType: input.mediaType,
      width: input.width,
      height: input.height,
      bytes: content.byteLength,
    };
  }

  async writeAsset(asset: StoredCardImageAsset): Promise<void> {
    validateAsset(asset);
    for (const variant of Object.values(asset.variants)) {
      if (!variant) continue;
      await this.verifyVariantBlob(variant);
    }
    await this.writeJsonAtomically(
      this.assetManifestPath(asset.assetHash),
      asset,
    );
  }

  async readAsset(assetHash: string): Promise<StoredCardImageAsset> {
    validateAssetHash(assetHash);
    const asset = await this.readAssetIfPresent(assetHash);
    if (!asset)
      throw new CardImageStoreError(
        "asset_not_found",
        `Kartenbild-Asset ${assetHash} wurde nicht gefunden.`,
      );
    return asset;
  }

  async readCollection(
    collectionId: string,
  ): Promise<CardImageCollectionManifest> {
    validateCollectionId(collectionId);
    const file = this.collectionManifestPath(collectionId);
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as unknown;
      return validateCollection(parsed, collectionId);
    } catch (error) {
      if (isMissingFileError(error)) return emptyCollection(collectionId);
      if (error instanceof CardImageStoreError) throw error;
      throw new CardImageStoreError(
        "collection_manifest_invalid",
        `Bildsammlung ${collectionId} konnte nicht gelesen werden.`,
      );
    }
  }

  async resolveBinding(
    collectionId: string,
    printingId: string,
  ): Promise<CardImageBinding | undefined> {
    validatePrintingId(printingId);
    const collection = await this.readCollection(collectionId);
    return collection.bindings[printingId];
  }

  async applyBindings(
    collectionId: string,
    changes: readonly CardImageBindingChange[],
    onExisting: CardImageBindingConflictMode = "fail",
  ): Promise<CardImageBindingResult[]> {
    validateCollectionId(collectionId);
    validateUniqueChanges(changes);
    for (const change of changes) {
      validatePrintingId(change.printingId);
      await this.verifyAsset(change.assetHash);
    }
    const collection = await this.readCollection(collectionId);
    const nextBindings = { ...collection.bindings };
    const results: CardImageBindingResult[] = [];
    let changed = false;
    const updatedAt = this.now().toISOString();

    for (const change of changes) {
      const existing = nextBindings[change.printingId];
      if (existing?.assetHash === change.assetHash) {
        results.push({ ...change, status: "unchanged" });
        continue;
      }
      if (existing && onExisting === "fail")
        throw new CardImageStoreError(
          "binding_exists",
          `Für ${change.printingId} existiert bereits eine persönliche Bildbindung.`,
        );
      if (existing && onExisting === "skip") {
        results.push({
          ...change,
          status: "skipped",
          previousAssetHash: existing.assetHash,
        });
        continue;
      }
      nextBindings[change.printingId] = {
        ...change,
        updatedAt,
      };
      results.push({
        ...change,
        status: existing ? "replaced" : "bound",
        ...(existing ? { previousAssetHash: existing.assetHash } : {}),
      });
      changed = true;
    }

    if (changed) {
      await this.writeCollection({
        ...collection,
        revision: collection.revision + 1,
        bindings: sortBindings(nextBindings),
      });
    }
    return results;
  }

  async removeBinding(
    collectionId: string,
    printingId: string,
  ): Promise<boolean> {
    validateCollectionId(collectionId);
    validatePrintingId(printingId);
    const collection = await this.readCollection(collectionId);
    if (!collection.bindings[printingId]) return false;
    const bindings = { ...collection.bindings };
    delete bindings[printingId];
    await this.writeCollection({
      ...collection,
      revision: collection.revision + 1,
      bindings: sortBindings(bindings),
    });
    return true;
  }

  absoluteVariantPath(variant: StoredCardImageVariant): string {
    const absolute = path.resolve(this.root, variant.relativePath);
    if (!absolute.startsWith(`${this.root}${path.sep}`))
      throw new CardImageStoreError(
        "asset_manifest_invalid",
        "Asset-Manifest enthält einen unsicheren Blobpfad.",
      );
    return absolute;
  }

  private async verifyAsset(assetHash: string): Promise<void> {
    const asset = await this.readAsset(assetHash);
    const master = asset.variants.master;
    if (!master)
      throw new CardImageStoreError(
        "asset_manifest_invalid",
        `Kartenbild-Asset ${assetHash} besitzt keinen Master.`,
      );
    await this.verifyVariantBlob(master);
  }

  async verifyVariantBlob(variant: StoredCardImageVariant): Promise<void> {
    const file = this.absoluteVariantPath(variant);
    try {
      await verifyExistingBlob(file, variant.blobHash);
    } catch (error) {
      if (isMissingFileError(error))
        throw new CardImageStoreError(
          "asset_blob_missing",
          `Blob ${variant.blobHash} fehlt im Kartenbildspeicher.`,
        );
      throw error;
    }
  }

  private async readAssetIfPresent(
    assetHash: string,
  ): Promise<StoredCardImageAsset | undefined> {
    validateAssetHash(assetHash);
    try {
      const parsed = JSON.parse(
        await readFile(this.assetManifestPath(assetHash), "utf8"),
      ) as unknown;
      return validateAsset(parsed, assetHash);
    } catch (error) {
      if (isMissingFileError(error)) return undefined;
      if (error instanceof CardImageStoreError) throw error;
      throw new CardImageStoreError(
        "asset_manifest_invalid",
        `Kartenbild-Asset ${assetHash} konnte nicht gelesen werden.`,
      );
    }
  }

  private async writeCollection(
    collection: CardImageCollectionManifest,
  ): Promise<void> {
    validateCollection(collection, collection.collectionId);
    await this.writeJsonAtomically(
      this.collectionManifestPath(collection.collectionId),
      collection,
    );
  }

  private assetManifestPath(assetHash: string): string {
    validateAssetHash(assetHash);
    return path.join(this.root, "assets", `${assetHash}.json`);
  }

  private collectionManifestPath(collectionId: string): string {
    validateCollectionId(collectionId);
    return path.join(this.root, "collections", collectionId, "bindings.json");
  }

  private async writeJsonAtomically(
    target: string,
    value: unknown,
  ): Promise<void> {
    await this.writeFileAtomically(
      target,
      Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"),
    );
  }

  private async writeFileAtomically(
    target: string,
    content: Uint8Array,
  ): Promise<void> {
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = path.join(
      path.dirname(target),
      `.${path.basename(target)}.${process.pid}.${randomUUID()}.tmp`,
    );
    try {
      await writeFile(temporary, content, { flag: "wx" });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
  }
}

function emptyCollection(collectionId: string): CardImageCollectionManifest {
  return {
    schemaVersion: CARD_IMAGE_COLLECTION_SCHEMA_VERSION,
    collectionId,
    revision: 0,
    bindings: {},
  };
}

function validateCollection(
  value: unknown,
  expectedCollectionId: string,
): CardImageCollectionManifest {
  if (!isRecord(value)) throw invalidCollection(expectedCollectionId);
  if (
    value.schemaVersion !== CARD_IMAGE_COLLECTION_SCHEMA_VERSION ||
    value.collectionId !== expectedCollectionId ||
    !Number.isInteger(value.revision) ||
    Number(value.revision) < 0 ||
    !isRecord(value.bindings)
  )
    throw invalidCollection(expectedCollectionId);
  const bindings: Record<string, CardImageBinding> = {};
  for (const [printingId, binding] of Object.entries(value.bindings)) {
    validatePrintingId(printingId);
    if (
      !isRecord(binding) ||
      binding.printingId !== printingId ||
      typeof binding.assetHash !== "string" ||
      typeof binding.updatedAt !== "string"
    )
      throw invalidCollection(expectedCollectionId);
    validateAssetHash(binding.assetHash);
    bindings[printingId] = {
      printingId,
      assetHash: binding.assetHash,
      updatedAt: binding.updatedAt,
    };
  }
  return {
    schemaVersion: CARD_IMAGE_COLLECTION_SCHEMA_VERSION,
    collectionId: expectedCollectionId,
    revision: Number(value.revision),
    bindings: sortBindings(bindings),
  };
}

function validateAsset(
  value: unknown,
  expectedAssetHash?: string,
): StoredCardImageAsset {
  if (
    !isRecord(value) ||
    value.schemaVersion !== CARD_IMAGE_STORE_SCHEMA_VERSION ||
    typeof value.assetHash !== "string" ||
    typeof value.createdAt !== "string" ||
    !isRecord(value.variants)
  )
    throw invalidAssetManifest(expectedAssetHash);
  validateAssetHash(value.assetHash);
  if (expectedAssetHash && value.assetHash !== expectedAssetHash)
    throw invalidAssetManifest(expectedAssetHash);
  const variants: StoredCardImageAsset["variants"] = {};
  for (const [kind, candidate] of Object.entries(value.variants)) {
    if (!isVariantKind(kind) || !isRecord(candidate))
      throw invalidAssetManifest(value.assetHash);
    if (
      candidate.kind !== kind ||
      typeof candidate.blobHash !== "string" ||
      typeof candidate.relativePath !== "string" ||
      !isMediaType(candidate.mediaType) ||
      !Number.isInteger(candidate.width) ||
      !Number.isInteger(candidate.height) ||
      !Number.isInteger(candidate.bytes)
    )
      throw invalidAssetManifest(value.assetHash);
    validateAssetHash(candidate.blobHash);
    validateImageDimensions(Number(candidate.width), Number(candidate.height));
    const expectedPath = blobRelativePath(
      candidate.blobHash,
      candidate.mediaType,
    );
    if (candidate.relativePath !== expectedPath)
      throw invalidAssetManifest(value.assetHash);
    variants[kind] = {
      kind,
      blobHash: candidate.blobHash,
      relativePath: candidate.relativePath,
      mediaType: candidate.mediaType,
      width: Number(candidate.width),
      height: Number(candidate.height),
      bytes: Number(candidate.bytes),
    };
  }
  if (variants.master && variants.master.blobHash !== value.assetHash)
    throw invalidAssetManifest(value.assetHash);
  return {
    schemaVersion: CARD_IMAGE_STORE_SCHEMA_VERSION,
    assetHash: value.assetHash,
    createdAt: value.createdAt,
    variants,
  };
}

function validateUniqueChanges(
  changes: readonly CardImageBindingChange[],
): void {
  const seen = new Set<string>();
  for (const change of changes) {
    if (seen.has(change.printingId))
      throw new CardImageStoreError(
        "duplicate_binding_change",
        `Import enthält ${change.printingId} mehrfach.`,
      );
    seen.add(change.printingId);
  }
}

function validateCollectionId(collectionId: string): void {
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(collectionId))
    throw new CardImageStoreError(
      "invalid_collection_id",
      `Ungültige Bildsammlung ${collectionId}.`,
    );
}

function validatePrintingId(printingId: string): void {
  if (!/^[a-z0-9][a-z0-9_-]{0,191}$/.test(printingId))
    throw new CardImageStoreError(
      "invalid_printing_id",
      `Ungültige printingId ${printingId}.`,
    );
}

function validateAssetHash(assetHash: string): void {
  if (!/^[a-f0-9]{64}$/.test(assetHash))
    throw new CardImageStoreError(
      "invalid_asset_hash",
      `Ungültiger Kartenbild-Hash ${assetHash}.`,
    );
}

function validateImageDimensions(width: number, height: number): void {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new CardImageStoreError(
      "invalid_image_dimensions",
      `Ungültige Bildabmessungen ${width} × ${height}.`,
    );
}

function blobRelativePath(
  blobHash: string,
  mediaType: CardImageMediaType,
): string {
  validateAssetHash(blobHash);
  return path.posix.join(
    "blobs",
    "sha256",
    blobHash.slice(0, 2),
    `${blobHash}.${extensionForMediaType(mediaType)}`,
  );
}

function extensionForMediaType(mediaType: CardImageMediaType): string {
  if (mediaType === "image/png") return "png";
  if (mediaType === "image/jpeg") return "jpg";
  return "webp";
}

function isMediaType(value: unknown): value is CardImageMediaType {
  return (
    value === "image/png" || value === "image/jpeg" || value === "image/webp"
  );
}

function isVariantKind(value: string): value is CardImageVariantKind {
  return (
    value === "master" ||
    value === "thumb" ||
    value === "preview" ||
    value === "full"
  );
}

function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

async function verifyExistingBlob(
  file: string,
  expectedHash: string,
): Promise<void> {
  const content = await readFile(file);
  if (sha256(content) !== expectedHash)
    throw new CardImageStoreError(
      "asset_blob_corrupt",
      `Vorhandener Kartenbild-Blob ${expectedHash} ist beschädigt.`,
    );
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function sortBindings(
  bindings: Record<string, CardImageBinding>,
): Record<string, CardImageBinding> {
  return Object.fromEntries(
    Object.entries(bindings).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function invalidAssetManifest(assetHash?: string): CardImageStoreError {
  return new CardImageStoreError(
    "asset_manifest_invalid",
    `Kartenbild-Asset${assetHash ? ` ${assetHash}` : ""} besitzt ein ungültiges Manifest.`,
  );
}

function invalidCollection(collectionId: string): CardImageStoreError {
  return new CardImageStoreError(
    "collection_manifest_invalid",
    `Bildsammlung ${collectionId} besitzt ein ungültiges Manifest.`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
