import { createHash, randomUUID } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { createRuntimeCardsById, type CatalogCard } from "@netgrid/catalog";
import {
  parseCardImageMappingCsv,
  serializeCardImageMappingCsv,
  type CardImageCropPixels,
  type CardImageMappingRow,
} from "./csv";
import {
  importCardImagesFromCsv,
  type CardImageImportReport,
} from "./importer";
import { normalizeCardImage } from "./normalizer";
import {
  resolveNetgridCardImagePackBuildRoot,
  resolveNetgridCardImagePackSourceRoot,
  type NetgridPathOptions,
} from "./paths";
import {
  CardImageStore,
  type CardImageBindingConflictMode,
  type CardImageMediaType,
} from "./store";

export const CARD_IMAGE_PACK_SCHEMA_VERSION = "netgrid-card-image-pack-v1";
export const CARD_IMAGE_PACK_IMPORTER_VERSION = 2;
export const CARD_IMAGE_PACK_MANIFEST_FILE = "netgrid-card-image-pack.json";
export const CARD_IMAGE_PACK_MAPPING_FILE = "mapping.csv";

export type PrivateCardImagePackProfileId =
  | "originalset"
  | "proteus"
  | "classic";

export type PrivateCardImagePackProfile = {
  profileId: PrivateCardImagePackProfileId;
  packId: string;
  displayName: string;
  setId: string;
  expectedCardCount: number;
};

export const PRIVATE_CARD_IMAGE_PACK_PROFILES = Object.freeze({
  originalset: Object.freeze({
    profileId: "originalset",
    packId: "netgrid-private-originalset-images",
    displayName: "NETGRID private Bilder – Originalset",
    setId: "originalset-v1",
    expectedCardCount: 374,
  }),
  proteus: Object.freeze({
    profileId: "proteus",
    packId: "netgrid-private-proteus-images",
    displayName: "NETGRID private Bilder – Proteus",
    setId: "proteus",
    expectedCardCount: 154,
  }),
  classic: Object.freeze({
    profileId: "classic",
    packId: "netgrid-private-classic-images",
    displayName: "NETGRID private Bilder – Classic",
    setId: "classic",
    expectedCardCount: 54,
  }),
} satisfies Record<PrivateCardImagePackProfileId, PrivateCardImagePackProfile>);

export type CardImagePackEntry = {
  printingId: string;
  relativePath: string;
  sourceSha256: string;
  mediaType: CardImageMediaType;
  bytes: number;
  cropPixels?: CardImageCropPixels;
};

export type CardImagePackManifest = {
  schemaVersion: typeof CARD_IMAGE_PACK_SCHEMA_VERSION;
  minimumImporterVersion: number;
  packId: string;
  profileId: PrivateCardImagePackProfileId;
  displayName: string;
  setId: string;
  createdAt: string;
  cardCount: number;
  catalogFingerprint: string;
  entries: CardImagePackEntry[];
};

export type CardImagePackErrorCode =
  | "pack_profile_invalid"
  | "pack_catalog_mismatch"
  | "pack_mapping_missing"
  | "pack_mapping_incomplete"
  | "pack_source_remote_forbidden"
  | "pack_source_missing"
  | "pack_source_too_large"
  | "pack_source_hash_mismatch"
  | "pack_output_exists"
  | "pack_manifest_missing"
  | "pack_manifest_invalid"
  | "pack_importer_too_old"
  | "pack_path_invalid"
  | "pack_file_missing"
  | "pack_file_hash_mismatch";

export class CardImagePackError extends Error {
  constructor(
    readonly code: CardImagePackErrorCode,
    message: string,
    readonly printingId?: string,
  ) {
    super(message);
    this.name = "CardImagePackError";
  }
}

export type BuildPrivateCardImagePackOptions = {
  profileId: PrivateCardImagePackProfileId;
  mappingFile: string;
  replace?: boolean;
  now?: () => Date;
  pathOptions?: NetgridPathOptions;
  localSourceResolver?: (
    source: string,
    mappingDirectory: string,
    printingId: string,
  ) => Promise<string>;
  onProgress?: (progress: CardImagePackProgress) => void;
};

export type BuildPrivateCardImagePackResult = {
  outputDirectory: string;
  manifest: CardImagePackManifest;
};

export type ImportPrivateCardImagePackOptions = {
  packDirectory: string;
  store?: CardImageStore;
  collectionId?: string;
  onExisting?: CardImageBindingConflictMode;
  dryRun?: boolean;
  now?: () => Date;
  onProgress?: (progress: CardImagePackProgress) => void;
};

export type CardImagePackProgress = {
  phase: "validating" | "building" | "preparing" | "storing";
  completed: number;
  total: number;
  printingId?: string;
};

export type ImportPrivateCardImagePackResult = {
  packId: string;
  profileId: PrivateCardImagePackProfileId;
  importReport: CardImageImportReport;
};

type PackContext = {
  profile: PrivateCardImagePackProfile;
  cards: readonly CatalogCard[];
};

const MAX_PACK_SOURCE_BYTES = 50 * 1024 * 1024;

export function privateCardImagePackProfile(
  profileId: string,
): PrivateCardImagePackProfile {
  if (
    profileId !== "originalset" &&
    profileId !== "proteus" &&
    profileId !== "classic"
  )
    throw new CardImagePackError(
      "pack_profile_invalid",
      `Unbekanntes privates Bildpaketprofil ${profileId}.`,
    );
  return PRIVATE_CARD_IMAGE_PACK_PROFILES[profileId];
}

export function createPrivateCardImagePackTemplate(
  profileId: PrivateCardImagePackProfileId,
  cards: readonly CatalogCard[] = Object.values(createRuntimeCardsById()),
): string {
  const context = createPackContext(
    privateCardImagePackProfile(profileId),
    cards,
  );
  return serializeCardImageMappingCsv(context.cards);
}

export async function writePrivateCardImagePackTemplate(
  profileId: PrivateCardImagePackProfileId,
  options: { replace?: boolean; pathOptions?: NetgridPathOptions } = {},
): Promise<string> {
  const profile = privateCardImagePackProfile(profileId);
  const directory = path.join(
    resolveNetgridCardImagePackSourceRoot(options.pathOptions),
    profile.profileId,
  );
  const target = path.join(directory, CARD_IMAGE_PACK_MAPPING_FILE);
  if (!options.replace && (await fileExists(target)))
    throw new CardImagePackError(
      "pack_output_exists",
      `Paketvorlage für ${profile.profileId} existiert bereits.`,
    );
  await mkdir(directory, { recursive: true });
  await writeFile(
    target,
    createPrivateCardImagePackTemplate(profileId),
    "utf8",
  );
  return target;
}

export async function buildPrivateCardImagePack(
  options: BuildPrivateCardImagePackOptions,
): Promise<BuildPrivateCardImagePackResult> {
  const cards = Object.values(createRuntimeCardsById());
  return buildCardImagePack(
    {
      profile: privateCardImagePackProfile(options.profileId),
      cards,
    },
    {
      mappingFile: options.mappingFile,
      buildRoot: resolveNetgridCardImagePackBuildRoot(options.pathOptions),
      replace: options.replace ?? false,
      now: options.now ?? (() => new Date()),
      localSourceResolver: options.localSourceResolver,
      onProgress: options.onProgress,
    },
  );
}

export async function importPrivateCardImagePack(
  options: ImportPrivateCardImagePackOptions,
): Promise<ImportPrivateCardImagePackResult> {
  const cards = Object.values(createRuntimeCardsById());
  const packDirectory = await canonicalPackRoot(options.packDirectory);
  const rawManifest = await readManifest(packDirectory);
  const profile = privateCardImagePackProfile(rawProfileId(rawManifest));
  return importCardImagePack(
    createPackContext(profile, cards),
    rawManifest,
    packDirectory,
    options,
  );
}

async function buildCardImagePack(
  rawContext: PackContext,
  options: {
    mappingFile: string;
    buildRoot: string;
    replace: boolean;
    now: () => Date;
    localSourceResolver?: BuildPrivateCardImagePackOptions["localSourceResolver"];
    onProgress?: BuildPrivateCardImagePackOptions["onProgress"];
  },
): Promise<BuildPrivateCardImagePackResult> {
  const context = createPackContext(rawContext.profile, rawContext.cards);
  const mappingFile = path.resolve(options.mappingFile);
  let mappingText: string;
  try {
    mappingText = await readFile(mappingFile, "utf8");
  } catch (error) {
    if (isMissingFileError(error))
      throw new CardImagePackError(
        "pack_mapping_missing",
        "Bildpaket-Zuordnungstabelle wurde nicht gefunden.",
      );
    throw error;
  }
  const rows = parseCardImageMappingCsv(mappingText, rawContext.cards);
  const selected = validateCompleteMapping(context, rows);
  const buildRoot = path.resolve(options.buildRoot);
  const target = safeChildPath(buildRoot, context.profile.profileId);
  if (!options.replace && (await fileExists(target)))
    throw new CardImagePackError(
      "pack_output_exists",
      `Bildpaketausgabe für ${context.profile.profileId} existiert bereits.`,
    );
  await mkdir(buildRoot, { recursive: true });
  const staging = safeChildPath(
    buildRoot,
    `.staging-${context.profile.profileId}-${randomUUID()}`,
  );
  await mkdir(path.join(staging, "images"), { recursive: true });
  try {
    const entries: CardImagePackEntry[] = [];
    const assignments = new Map<
      string,
      {
        source: string;
        expectedSha256: string;
        cropPixels?: CardImageCropPixels;
      }
    >();
    const rowsByPrintingId = new Map(
      selected.map((row) => [row.printingId, row]),
    );
    options.onProgress?.({
      phase: "building",
      completed: 0,
      total: context.cards.length,
    });
    for (const [index, card] of context.cards.entries()) {
      const row = rowsByPrintingId.get(card.printingId)!;
      const source = await readPackBuildSource(
        row,
        path.dirname(mappingFile),
        options.localSourceResolver,
      );
      const normalized = await normalizeCardImage(
        source,
        card.printingId,
        row.cropPixels ? { cropPixels: row.cropPixels } : {},
      );
      if (row.expectedSha256 && row.expectedSha256 !== normalized.sourceHash)
        throw new CardImagePackError(
          "pack_source_hash_mismatch",
          `Quellhash für ${card.printingId} stimmt nicht.`,
          card.printingId,
        );
      const relativePath = packImageRelativePath(
        card.printingId,
        normalized.sourceMediaType,
      );
      await writeFile(safePackFile(staging, relativePath), source, {
        flag: "wx",
      });
      entries.push({
        printingId: card.printingId,
        relativePath,
        sourceSha256: normalized.sourceHash,
        mediaType: normalized.sourceMediaType,
        bytes: normalized.sourceBytes,
        ...(row.cropPixels ? { cropPixels: row.cropPixels } : {}),
      });
      assignments.set(card.printingId, {
        source: relativePath,
        expectedSha256: normalized.sourceHash,
        ...(row.cropPixels ? { cropPixels: row.cropPixels } : {}),
      });
      options.onProgress?.({
        phase: "building",
        completed: index + 1,
        total: context.cards.length,
        printingId: card.printingId,
      });
    }
    const manifest: CardImagePackManifest = {
      schemaVersion: CARD_IMAGE_PACK_SCHEMA_VERSION,
      minimumImporterVersion: entries.some((entry) => entry.cropPixels)
        ? CARD_IMAGE_PACK_IMPORTER_VERSION
        : 1,
      packId: context.profile.packId,
      profileId: context.profile.profileId,
      displayName: context.profile.displayName,
      setId: context.profile.setId,
      createdAt: options.now().toISOString(),
      cardCount: entries.length,
      catalogFingerprint: catalogFingerprint(context.profile, context.cards),
      entries,
    };
    await writeFile(
      path.join(staging, CARD_IMAGE_PACK_MAPPING_FILE),
      serializeCardImageMappingCsv(context.cards, assignments),
      { encoding: "utf8", flag: "wx" },
    );
    await writeFile(
      path.join(staging, CARD_IMAGE_PACK_MANIFEST_FILE),
      `${JSON.stringify(manifest, null, 2)}\n`,
      { encoding: "utf8", flag: "wx" },
    );
    await activateBuildOutput(staging, target, options.replace);
    return { outputDirectory: target, manifest };
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

async function importCardImagePack(
  rawContext: PackContext,
  rawManifest: unknown,
  packDirectory: string,
  options: ImportPrivateCardImagePackOptions,
): Promise<ImportPrivateCardImagePackResult> {
  const context = createPackContext(rawContext.profile, rawContext.cards);
  const manifest = validateManifest(rawManifest, context);
  const entryByPrintingId = new Map(
    manifest.entries.map((entry) => [entry.printingId, entry]),
  );
  options.onProgress?.({
    phase: "validating",
    completed: 0,
    total: context.cards.length,
  });
  for (const [index, card] of context.cards.entries()) {
    const entry = entryByPrintingId.get(card.printingId)!;
    let content: Buffer;
    try {
      content = await readVerifiedPackFile(
        packDirectory,
        entry.relativePath,
        new CardImagePackError(
          "pack_file_missing",
          `Paketdatei für ${card.printingId} fehlt.`,
          card.printingId,
        ),
      );
    } catch (error) {
      throw error;
    }
    if (
      content.byteLength !== entry.bytes ||
      sha256(content) !== entry.sourceSha256
    )
      throw new CardImagePackError(
        "pack_file_hash_mismatch",
        `Paketdatei für ${card.printingId} stimmt nicht mit dem Manifest überein.`,
        card.printingId,
      );
    options.onProgress?.({
      phase: "validating",
      completed: index + 1,
      total: context.cards.length,
      printingId: card.printingId,
    });
  }
  await validateBundledMapping(packDirectory, context, manifest);
  const importReport = await importCardImagesFromCsv({
    mappingFile: path.join(packDirectory, CARD_IMAGE_PACK_MAPPING_FILE),
    ...(options.store ? { store: options.store } : {}),
    collectionId: options.collectionId ?? "personal",
    onExisting: options.onExisting ?? "fail",
    dryRun: options.dryRun ?? false,
    ...(options.now ? { now: options.now } : {}),
    cards: rawContext.cards,
    onProgress: (progress) => {
      const completed =
        progress.phase === "storing"
          ? progress.completed - context.cards.length
          : progress.completed;
      options.onProgress?.({
        phase: progress.phase,
        completed,
        total: context.cards.length,
        ...(progress.printingId ? { printingId: progress.printingId } : {}),
      });
    },
  });
  return {
    packId: manifest.packId,
    profileId: manifest.profileId,
    importReport,
  };
}

function createPackContext(
  profile: PrivateCardImagePackProfile,
  allCards: readonly CatalogCard[],
): PackContext {
  const cards = allCards
    .filter((card) => card.setId === profile.setId)
    .sort(comparePackCards);
  if (
    cards.length !== profile.expectedCardCount ||
    new Set(cards.map((card) => card.printingId)).size !== cards.length
  )
    throw new CardImagePackError(
      "pack_catalog_mismatch",
      `Katalogprofil ${profile.profileId} erwartet ${profile.expectedCardCount}, enthält aber ${cards.length} eindeutige Bilder.`,
    );
  return { profile, cards };
}

function validateCompleteMapping(
  context: PackContext,
  rows: readonly CardImageMappingRow[],
): CardImageMappingRow[] {
  const selected = rows.filter((row) => row.enabled);
  const expected = new Set(context.cards.map((card) => card.printingId));
  if (
    rows.length !== context.cards.length ||
    selected.length !== context.cards.length ||
    selected.some(
      (row) =>
        row.setId !== context.profile.setId || !expected.has(row.printingId),
    )
  )
    throw new CardImagePackError(
      "pack_mapping_incomplete",
      `Bildpaket ${context.profile.profileId} benötigt exakt ${context.profile.expectedCardCount} aktivierte Set-Bilder.`,
    );
  return selected;
}

async function readPackBuildSource(
  row: CardImageMappingRow,
  mappingDirectory: string,
  localSourceResolver?: BuildPrivateCardImagePackOptions["localSourceResolver"],
): Promise<Buffer> {
  if (hasUrlScheme(row.source))
    throw new CardImagePackError(
      "pack_source_remote_forbidden",
      `Bildpaket-Builder akzeptiert für ${row.printingId} nur lokale Quellen.`,
      row.printingId,
    );
  const source = localSourceResolver
    ? await localSourceResolver(row.source, mappingDirectory, row.printingId)
    : path.isAbsolute(row.source)
      ? path.resolve(row.source)
      : path.resolve(mappingDirectory, row.source);
  let content: Buffer;
  try {
    content = await readFile(source);
  } catch (error) {
    if (isMissingFileError(error))
      throw new CardImagePackError(
        "pack_source_missing",
        `Lokale Paketquelle für ${row.printingId} fehlt.`,
        row.printingId,
      );
    throw error;
  }
  if (content.byteLength > MAX_PACK_SOURCE_BYTES)
    throw new CardImagePackError(
      "pack_source_too_large",
      `Lokale Paketquelle für ${row.printingId} überschreitet 50 MiB.`,
      row.printingId,
    );
  return content;
}

async function validateBundledMapping(
  packDirectory: string,
  context: PackContext,
  manifest: CardImagePackManifest,
): Promise<void> {
  let mappingText: string;
  try {
    mappingText = (
      await readVerifiedPackFile(
        packDirectory,
        CARD_IMAGE_PACK_MAPPING_FILE,
        new CardImagePackError(
          "pack_mapping_missing",
          "Bildpaket enthält keine Zuordnungstabelle.",
        ),
      )
    ).toString("utf8");
  } catch (error) {
    throw error;
  }
  const rows = validateCompleteMapping(
    context,
    parseCardImageMappingCsv(mappingText, context.cards),
  );
  const entries = new Map(
    manifest.entries.map((entry) => [entry.printingId, entry]),
  );
  for (const row of rows) {
    const entry = entries.get(row.printingId)!;
    if (
      row.source !== entry.relativePath ||
      row.expectedSha256 !== entry.sourceSha256 ||
      !sameCropPixels(row.cropPixels, entry.cropPixels)
    )
      throw new CardImagePackError(
        "pack_manifest_invalid",
        `Zuordnung für ${row.printingId} stimmt nicht mit dem Paketmanifest überein.`,
        row.printingId,
      );
  }
}

function sameCropPixels(
  left: CardImageCropPixels | undefined,
  right: CardImageCropPixels | undefined,
): boolean {
  if (!left || !right) return left === right;
  return (
    left.left === right.left &&
    left.top === right.top &&
    left.right === right.right &&
    left.bottom === right.bottom
  );
}

function manifestCropPixels(
  value: unknown,
  printingId: string,
): CardImageCropPixels | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw invalidManifest(printingId);
  const crop = {
    left: value.left,
    top: value.top,
    right: value.right,
    bottom: value.bottom,
  };
  if (
    Object.values(crop).some(
      (part) =>
        !Number.isSafeInteger(part) ||
        Number(part) < 0 ||
        Number(part) > 100_000,
    )
  )
    throw invalidManifest(printingId);
  return {
    left: Number(crop.left),
    top: Number(crop.top),
    right: Number(crop.right),
    bottom: Number(crop.bottom),
  };
}

function validateManifest(
  value: unknown,
  context: PackContext,
): CardImagePackManifest {
  if (
    !isRecord(value) ||
    value.schemaVersion !== CARD_IMAGE_PACK_SCHEMA_VERSION ||
    !Number.isInteger(value.minimumImporterVersion) ||
    typeof value.packId !== "string" ||
    value.profileId !== context.profile.profileId ||
    typeof value.displayName !== "string" ||
    value.setId !== context.profile.setId ||
    typeof value.createdAt !== "string" ||
    !Number.isInteger(value.cardCount) ||
    typeof value.catalogFingerprint !== "string" ||
    !Array.isArray(value.entries)
  )
    throw invalidManifest();
  const minimumImporterVersion = Number(value.minimumImporterVersion);
  if (minimumImporterVersion > CARD_IMAGE_PACK_IMPORTER_VERSION)
    throw new CardImagePackError(
      "pack_importer_too_old",
      `Bildpaket benötigt Importer-Version ${minimumImporterVersion}.`,
    );
  if (
    minimumImporterVersion < 1 ||
    value.packId !== context.profile.packId ||
    value.displayName !== context.profile.displayName ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    Number(value.cardCount) !== context.profile.expectedCardCount ||
    value.entries.length !== context.profile.expectedCardCount ||
    value.catalogFingerprint !==
      catalogFingerprint(context.profile, context.cards)
  )
    throw invalidManifest();
  const entries: CardImagePackEntry[] = [];
  for (const [index, card] of context.cards.entries()) {
    const candidate = value.entries[index];
    if (
      !isRecord(candidate) ||
      candidate.printingId !== card.printingId ||
      typeof candidate.relativePath !== "string" ||
      typeof candidate.sourceSha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(candidate.sourceSha256) ||
      !isMediaType(candidate.mediaType) ||
      !Number.isSafeInteger(candidate.bytes) ||
      Number(candidate.bytes) <= 0 ||
      Number(candidate.bytes) > MAX_PACK_SOURCE_BYTES ||
      candidate.relativePath !==
        packImageRelativePath(card.printingId, candidate.mediaType)
    )
      throw invalidManifest(card.printingId);
    const cropPixels = manifestCropPixels(
      candidate.cropPixels,
      card.printingId,
    );
    entries.push({
      printingId: card.printingId,
      relativePath: candidate.relativePath,
      sourceSha256: candidate.sourceSha256,
      mediaType: candidate.mediaType,
      bytes: Number(candidate.bytes),
      ...(cropPixels ? { cropPixels } : {}),
    });
  }
  if (
    minimumImporterVersion < CARD_IMAGE_PACK_IMPORTER_VERSION &&
    entries.some((entry) => entry.cropPixels)
  )
    throw invalidManifest();
  return {
    schemaVersion: CARD_IMAGE_PACK_SCHEMA_VERSION,
    minimumImporterVersion,
    packId: value.packId,
    profileId: context.profile.profileId,
    displayName: value.displayName,
    setId: context.profile.setId,
    createdAt: value.createdAt,
    cardCount: Number(value.cardCount),
    catalogFingerprint: value.catalogFingerprint,
    entries,
  };
}

async function readManifest(packDirectory: string): Promise<unknown> {
  try {
    return JSON.parse(
      (
        await readVerifiedPackFile(
          packDirectory,
          CARD_IMAGE_PACK_MANIFEST_FILE,
          new CardImagePackError(
            "pack_manifest_missing",
            "Bildpaketmanifest wurde nicht gefunden.",
          ),
        )
      ).toString("utf8"),
    ) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) throw invalidManifest();
    throw error;
  }
}

async function canonicalPackRoot(directory: string): Promise<string> {
  try {
    const root = await realpath(path.resolve(directory));
    if (!(await lstat(root)).isDirectory())
      throw new CardImagePackError(
        "pack_path_invalid",
        "Bildpaketpfad ist kein Verzeichnis.",
      );
    return root;
  } catch (error) {
    if (error instanceof CardImagePackError) throw error;
    if (isMissingFileError(error))
      throw new CardImagePackError(
        "pack_manifest_missing",
        "Bildpaketverzeichnis wurde nicht gefunden.",
      );
    throw error;
  }
}

async function readVerifiedPackFile(
  packDirectory: string,
  relativePath: string,
  missingError: CardImagePackError,
): Promise<Buffer> {
  const file = safePackFile(packDirectory, relativePath);
  try {
    const directStats = await lstat(file);
    if (directStats.isSymbolicLink() || !directStats.isFile())
      throw new CardImagePackError(
        "pack_path_invalid",
        "Bildpaketdatei ist keine reguläre lokale Datei.",
      );
    const canonicalFile = await realpath(file);
    safeChildPath(packDirectory, path.relative(packDirectory, canonicalFile));
    return await readFile(canonicalFile);
  } catch (error) {
    if (error instanceof CardImagePackError) throw error;
    if (isMissingFileError(error)) throw missingError;
    throw error;
  }
}

function rawProfileId(value: unknown): string {
  if (!isRecord(value) || typeof value.profileId !== "string")
    throw invalidManifest();
  return value.profileId;
}

async function activateBuildOutput(
  staging: string,
  target: string,
  replace: boolean,
): Promise<void> {
  if (!(await fileExists(target))) {
    await rename(staging, target);
    return;
  }
  if (!replace)
    throw new CardImagePackError(
      "pack_output_exists",
      "Bildpaketausgabe existiert bereits.",
    );
  const backup = `${target}.backup-${randomUUID()}`;
  await rename(target, backup);
  try {
    await rename(staging, target);
    await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (!(await fileExists(target)) && (await fileExists(backup)))
      await rename(backup, target);
    throw error;
  }
}

function safeChildPath(root: string, childName: string): string {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, childName);
  if (
    target === resolvedRoot ||
    !target.startsWith(`${resolvedRoot}${path.sep}`)
  )
    throw new CardImagePackError(
      "pack_path_invalid",
      "Bildpaketpfad verlässt den erlaubten lokalen Root.",
    );
  return target;
}

function safePackFile(packDirectory: string, relativePath: string): string {
  if (
    !relativePath ||
    path.posix.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath
      .split("/")
      .some((segment) => segment === ".." || segment === "")
  )
    throw new CardImagePackError(
      "pack_path_invalid",
      "Bildpaket enthält einen unsicheren relativen Pfad.",
    );
  return safeChildPath(packDirectory, relativePath.split("/").join(path.sep));
}

function packImageRelativePath(
  printingId: string,
  mediaType: CardImageMediaType,
): string {
  const extension =
    mediaType === "image/png"
      ? "png"
      : mediaType === "image/jpeg"
        ? "jpg"
        : "webp";
  return path.posix.join("images", `${printingId}.${extension}`);
}

function catalogFingerprint(
  profile: PrivateCardImagePackProfile,
  cards: readonly CatalogCard[],
): string {
  return sha256(
    Buffer.from(
      `${profile.setId}\n${cards.map((card) => card.printingId).join("\n")}\n`,
      "utf8",
    ),
  );
}

function comparePackCards(left: CatalogCard, right: CatalogCard): number {
  return (
    left.collectorNumber.localeCompare(right.collectorNumber, "en", {
      numeric: true,
    }) || left.printingId.localeCompare(right.printingId)
  );
}

function hasUrlScheme(source: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(source);
}

function isMediaType(value: unknown): value is CardImageMediaType {
  return (
    value === "image/png" || value === "image/jpeg" || value === "image/webp"
  );
}

function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function invalidManifest(printingId?: string): CardImagePackError {
  return new CardImagePackError(
    "pack_manifest_invalid",
    `Bildpaketmanifest${printingId ? ` für ${printingId}` : ""} ist ungültig.`,
    printingId,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

export const __cardImagePackTestOnly = {
  buildCardImagePack,
  importCardImagePack,
  createPackContext,
  validateManifest,
};
