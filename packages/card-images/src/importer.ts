import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRuntimeCardsById, type CatalogCard } from "@netgrid/catalog";
import sharp from "sharp";
import { parseCardImageMappingCsv, type CardImageMappingRow } from "./csv";
import {
  CardImageStore,
  CardImageStoreError,
  type CardImageBindingConflictMode,
  type CardImageBindingResultStatus,
  type CardImageMediaType,
} from "./store";

const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_INPUT_PIXELS = 100_000_000;
const MIN_WIDTH = 200;
const MIN_HEIGHT = 280;
const MAX_DIMENSION = 12_000;

export type CardImageImportErrorCode =
  | "mapping_file_missing"
  | "source_remote_not_allowed"
  | "source_file_missing"
  | "source_file_too_large"
  | "source_image_invalid"
  | "source_image_format_unsupported"
  | "source_image_dimensions_invalid"
  | "source_hash_mismatch";

export class CardImageImportError extends Error {
  constructor(
    readonly code: CardImageImportErrorCode,
    message: string,
    readonly printingId?: string,
  ) {
    super(message);
    this.name = "CardImageImportError";
  }
}

export type ImportCardImagesOptions = {
  mappingFile: string;
  store?: CardImageStore;
  collectionId?: string;
  onExisting?: CardImageBindingConflictMode;
  dryRun?: boolean;
  now?: () => Date;
  cards?: readonly CatalogCard[];
};

export type CardImageImportResult = {
  printingId: string;
  sourceFileName: string;
  assetHash: string;
  mediaType: CardImageMediaType;
  width: number;
  height: number;
  bytes: number;
  status: CardImageBindingResultStatus;
  previousAssetHash?: string;
};

export type CardImageImportReport = {
  schemaVersion: "card-image-import-report-v1";
  createdAt: string;
  collectionId: string;
  dryRun: boolean;
  onExisting: CardImageBindingConflictMode;
  tableRows: number;
  selectedRows: number;
  results: CardImageImportResult[];
  summary: Record<CardImageBindingResultStatus, number>;
};

type PreparedImage = {
  row: CardImageMappingRow;
  sourceFileName: string;
  content: Buffer;
  assetHash: string;
  mediaType: CardImageMediaType;
  width: number;
  height: number;
};

export async function importCardImagesFromCsv(
  options: ImportCardImagesOptions,
): Promise<CardImageImportReport> {
  const mappingFile = path.resolve(options.mappingFile);
  const cards = options.cards ?? Object.values(createRuntimeCardsById());
  let mappingText: string;
  try {
    mappingText = await readFile(mappingFile, "utf8");
  } catch (error) {
    if (isMissingFileError(error))
      throw new CardImageImportError(
        "mapping_file_missing",
        "Die Bildzuordnungstabelle wurde nicht gefunden.",
      );
    throw error;
  }
  const rows = parseCardImageMappingCsv(mappingText, cards);
  const selected = rows.filter((row) => row.enabled);
  const prepared: PreparedImage[] = [];
  for (const row of selected)
    prepared.push(await prepareLocalImage(row, path.dirname(mappingFile)));

  const store = options.store ?? new CardImageStore();
  const collectionId = options.collectionId ?? "personal";
  const onExisting = options.onExisting ?? "fail";
  const collection = await store.readCollection(collectionId);
  const planned = planBindingResults(prepared, collection.bindings, onExisting);

  let results = planned;
  if (!options.dryRun) {
    const changes = [];
    for (const image of prepared) {
      const asset = await store.putMasterAsset({
        content: image.content,
        mediaType: image.mediaType,
        width: image.width,
        height: image.height,
      });
      if (asset.assetHash !== image.assetHash)
        throw new CardImageStoreError(
          "asset_manifest_invalid",
          `Asset-Hash für ${image.row.printingId} änderte sich während des Imports.`,
        );
      changes.push({
        printingId: image.row.printingId,
        assetHash: image.assetHash,
      });
    }
    const applied = await store.applyBindings(
      collectionId,
      changes,
      onExisting,
    );
    const preparedByPrintingId = new Map(
      prepared.map((image) => [image.row.printingId, image]),
    );
    results = applied.map((result) =>
      reportResult(preparedByPrintingId.get(result.printingId)!, result),
    );
  }

  return {
    schemaVersion: "card-image-import-report-v1",
    createdAt: (options.now ?? (() => new Date()))().toISOString(),
    collectionId,
    dryRun: options.dryRun ?? false,
    onExisting,
    tableRows: rows.length,
    selectedRows: selected.length,
    results,
    summary: summarize(results),
  };
}

async function prepareLocalImage(
  row: CardImageMappingRow,
  mappingDirectory: string,
): Promise<PreparedImage> {
  if (/^https?:\/\//i.test(row.source))
    throw new CardImageImportError(
      "source_remote_not_allowed",
      `Remotequelle für ${row.printingId} ist in IMG01–IMG05 nicht erlaubt.`,
      row.printingId,
    );
  const source = path.isAbsolute(row.source)
    ? path.resolve(row.source)
    : path.resolve(mappingDirectory, row.source);
  let content: Buffer;
  try {
    content = await readFile(source);
  } catch (error) {
    if (isMissingFileError(error))
      throw new CardImageImportError(
        "source_file_missing",
        `Lokale Bildquelle für ${row.printingId} wurde nicht gefunden.`,
        row.printingId,
      );
    throw error;
  }
  if (content.byteLength > MAX_SOURCE_BYTES)
    throw new CardImageImportError(
      "source_file_too_large",
      `Bildquelle für ${row.printingId} überschreitet 50 MiB.`,
      row.printingId,
    );
  const assetHash = sha256(content);
  if (row.expectedSha256 && row.expectedSha256 !== assetHash)
    throw new CardImageImportError(
      "source_hash_mismatch",
      `SHA-256 der Bildquelle für ${row.printingId} stimmt nicht.`,
      row.printingId,
    );
  const metadata = await safeMetadata(content, row.printingId);
  const mediaType = mediaTypeForFormat(metadata.format, row.printingId);
  const width = metadata.width;
  const height = metadata.height;
  if (
    !width ||
    !height ||
    width < MIN_WIDTH ||
    height < MIN_HEIGHT ||
    width > MAX_DIMENSION ||
    height > MAX_DIMENSION ||
    width >= height
  )
    throw new CardImageImportError(
      "source_image_dimensions_invalid",
      `Bildquelle für ${row.printingId} besitzt keine plausiblen Kartenabmessungen.`,
      row.printingId,
    );
  return {
    row,
    sourceFileName: path.basename(source),
    content,
    assetHash,
    mediaType,
    width,
    height,
  };
}

async function safeMetadata(content: Buffer, printingId: string) {
  try {
    return await sharp(content, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata();
  } catch {
    throw new CardImageImportError(
      "source_image_invalid",
      `Bildquelle für ${printingId} konnte nicht sicher dekodiert werden.`,
      printingId,
    );
  }
}

function mediaTypeForFormat(
  format: string | undefined,
  printingId: string,
): CardImageMediaType {
  if (format === "png") return "image/png";
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  throw new CardImageImportError(
    "source_image_format_unsupported",
    `Bildformat für ${printingId} wird nicht unterstützt.`,
    printingId,
  );
}

function planBindingResults(
  prepared: readonly PreparedImage[],
  bindings: Record<string, { assetHash: string }>,
  onExisting: CardImageBindingConflictMode,
): CardImageImportResult[] {
  return prepared.map((image) => {
    const existing = bindings[image.row.printingId];
    if (existing?.assetHash === image.assetHash)
      return reportResult(image, { status: "unchanged" });
    if (existing && onExisting === "fail")
      throw new CardImageStoreError(
        "binding_exists",
        `Für ${image.row.printingId} existiert bereits eine persönliche Bildbindung.`,
      );
    if (existing && onExisting === "skip")
      return reportResult(image, {
        status: "skipped",
        previousAssetHash: existing.assetHash,
      });
    return reportResult(image, {
      status: existing ? "replaced" : "bound",
      ...(existing ? { previousAssetHash: existing.assetHash } : {}),
    });
  });
}

function reportResult(
  image: PreparedImage,
  binding: {
    status: CardImageBindingResultStatus;
    previousAssetHash?: string;
  },
): CardImageImportResult {
  return {
    printingId: image.row.printingId,
    sourceFileName: image.sourceFileName,
    assetHash: image.assetHash,
    mediaType: image.mediaType,
    width: image.width,
    height: image.height,
    bytes: image.content.byteLength,
    status: binding.status,
    ...(binding.previousAssetHash
      ? { previousAssetHash: binding.previousAssetHash }
      : {}),
  };
}

function summarize(
  results: readonly CardImageImportResult[],
): Record<CardImageBindingResultStatus, number> {
  const summary: Record<CardImageBindingResultStatus, number> = {
    bound: 0,
    replaced: 0,
    skipped: 0,
    unchanged: 0,
  };
  for (const result of results) summary[result.status] += 1;
  return summary;
}

function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
