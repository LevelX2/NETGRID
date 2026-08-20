import {
  link,
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { createRuntimeCardsById, type CatalogCard } from "@netgrid/catalog";
import {
  CARD_IMAGE_PACK_MANIFEST_FILE,
  PRIVATE_CARD_IMAGE_PACK_PROFILES,
  type PrivateCardImagePackProfileId,
} from "./packs";
import {
  resolveNetgridCardImageImportInboxRoot,
  type NetgridPathOptions,
} from "./paths";
import { CardImageStore } from "./store";
import { DEFAULT_CARD_IMAGE_PACK_ARCHIVE_LIMITS } from "./pack-archive";

const MAX_INBOX_ENTRIES = 4_096;
const MAX_INBOX_DEPTH = 12;

export type CardImageInboxErrorCode =
  | "inbox_entry_invalid"
  | "inbox_entry_missing"
  | "inbox_entry_type_invalid"
  | "inbox_mapping_invalid"
  | "inbox_mapping_too_large"
  | "inbox_mapping_exists"
  | "inbox_upload_invalid"
  | "inbox_upload_too_large"
  | "inbox_upload_exists"
  | "inbox_symlink_forbidden"
  | "inbox_too_large";

export class CardImageInboxError extends Error {
  constructor(
    readonly code: CardImageInboxErrorCode,
    message: string,
    readonly relativePath?: string,
  ) {
    super(message);
    this.name = "CardImageInboxError";
  }
}

export type CardImageInboxEntry = {
  relativePath: string;
  kind: "file" | "directory";
  usage: "mapping" | "image" | "pack" | "pack-archive" | "directory" | "other";
  bytes?: number;
};

export type CardImageInboxInventory = {
  schemaVersion: "netgrid-card-image-inbox-v1";
  entries: CardImageInboxEntry[];
};

export type CardImageSetInventory = {
  profileId: PrivateCardImagePackProfileId;
  displayName: string;
  setId: string;
  total: number;
  bound: number;
  missing: number;
  missingPrintingIds: string[];
};

export type CardImageCollectionInventory = {
  schemaVersion: "netgrid-card-image-collection-inventory-v1";
  collectionId: string;
  revision: number;
  totalBindings: number;
  unknownBindings: number;
  sets: CardImageSetInventory[];
};

export type CardImageInboxOptions = NetgridPathOptions & {
  inboxRoot?: string;
};

const MAX_MAPPING_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PACKAGE_UPLOAD_BYTES = 50 * 1024 * 1024;

export async function writeCardImageInboxMapping(
  fileName: string,
  content: string,
  options: CardImageInboxOptions = {},
): Promise<CardImageInboxEntry> {
  const normalizedName = fileName.trim();
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}\.csv$/i.test(normalizedName) ||
    path.basename(normalizedName) !== normalizedName
  )
    throw new CardImageInboxError(
      "inbox_mapping_invalid",
      "Die Zuordnungsdatei benötigt einen sicheren CSV-Dateinamen.",
    );
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes === 0)
    throw new CardImageInboxError(
      "inbox_mapping_invalid",
      "Die Zuordnungsdatei darf nicht leer sein.",
    );
  if (bytes > MAX_MAPPING_UPLOAD_BYTES)
    throw new CardImageInboxError(
      "inbox_mapping_too_large",
      "Die Zuordnungsdatei überschreitet 5 MiB.",
    );
  const root = await ensureInboxRoot(options);
  const directory = path.join(root, "mappings");
  const target = path.join(directory, normalizedName);
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(target, content, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (isAlreadyExistsError(error))
      throw new CardImageInboxError(
        "inbox_mapping_exists",
        `Die Zuordnungsdatei mappings/${normalizedName} existiert bereits.`,
        `mappings/${normalizedName}`,
      );
    throw error;
  }
  return {
    relativePath: `mappings/${normalizedName}`,
    kind: "file",
    usage: "mapping",
    bytes,
  };
}

export async function writeCardImageInboxPackageFile(
  packageName: string,
  relativeFilePath: string,
  content: Uint8Array,
  options: CardImageInboxOptions = {},
): Promise<{ package: string; file: string }> {
  const normalizedPackageName = packageName.trim();
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(normalizedPackageName) ||
    path.basename(normalizedPackageName) !== normalizedPackageName
  )
    throw new CardImageInboxError(
      "inbox_upload_invalid",
      "Der Paketupload benötigt einen sicheren Verzeichnisnamen.",
    );
  const safeFilePath = validateRelativeInboxPath(relativeFilePath);
  if (!isAllowedPackageUploadFile(safeFilePath))
    throw new CardImageInboxError(
      "inbox_upload_invalid",
      `Die Paketdatei ${safeFilePath} ist für IMG07 nicht zulässig.`,
      safeFilePath,
    );
  if (content.byteLength === 0)
    throw new CardImageInboxError(
      "inbox_upload_invalid",
      `Die Paketdatei ${safeFilePath} darf nicht leer sein.`,
      safeFilePath,
    );
  const maximumBytes = safeFilePath.startsWith("images/")
    ? MAX_PACKAGE_UPLOAD_BYTES
    : MAX_MAPPING_UPLOAD_BYTES;
  if (content.byteLength > maximumBytes)
    throw new CardImageInboxError(
      "inbox_upload_too_large",
      `Die Paketdatei ${safeFilePath} überschreitet das zulässige Bytelimit.`,
      safeFilePath,
    );
  const root = await ensureInboxRoot(options);
  const packageRoot = path.join(root, "uploads", normalizedPackageName);
  const target = path.resolve(packageRoot, ...safeFilePath.split("/"));
  assertWithinRoot(packageRoot, target, safeFilePath);
  await mkdir(path.dirname(target), { recursive: true });
  try {
    await writeFile(target, content, { flag: "wx" });
  } catch (error) {
    if (isAlreadyExistsError(error))
      throw new CardImageInboxError(
        "inbox_upload_exists",
        `Die Paketdatei uploads/${normalizedPackageName}/${safeFilePath} existiert bereits.`,
        `uploads/${normalizedPackageName}/${safeFilePath}`,
      );
    throw error;
  }
  return {
    package: `uploads/${normalizedPackageName}`,
    file: safeFilePath,
  };
}

export async function writeCardImageInboxPackageArchive(
  fileName: string,
  source: AsyncIterable<Uint8Array | string>,
  options: CardImageInboxOptions & { maximumBytes?: number } = {},
): Promise<CardImageInboxEntry> {
  const normalizedName = fileName.trim();
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}\.zip$/i.test(normalizedName) ||
    path.basename(normalizedName) !== normalizedName
  )
    throw new CardImageInboxError(
      "inbox_upload_invalid",
      "Der Paketupload benötigt einen sicheren ZIP-Dateinamen.",
    );
  const maximumBytes =
    options.maximumBytes ??
    DEFAULT_CARD_IMAGE_PACK_ARCHIVE_LIMITS.maxArchiveBytes;
  const root = await ensureInboxRoot(options);
  const directory = path.join(root, "archives");
  const relativePath = `archives/${normalizedName}`;
  const target = path.join(directory, normalizedName);
  const temporary = path.join(
    directory,
    `.${normalizedName}.${randomUUID()}.tmp`,
  );
  await mkdir(directory, { recursive: true });
  const handle = await open(temporary, "wx");
  let bytes = 0;
  try {
    for await (const chunk of source) {
      const content =
        typeof chunk === "string" || !Buffer.isBuffer(chunk)
          ? Buffer.from(chunk)
          : chunk;
      bytes += content.byteLength;
      if (bytes > maximumBytes)
        throw new CardImageInboxError(
          "inbox_upload_too_large",
          `Das ZIP-Bildpaket überschreitet ${maximumBytes} Bytes.`,
          relativePath,
        );
      let offset = 0;
      while (offset < content.byteLength) {
        const { bytesWritten } = await handle.write(
          content,
          offset,
          content.byteLength - offset,
        );
        offset += bytesWritten;
      }
    }
    if (bytes === 0)
      throw new CardImageInboxError(
        "inbox_upload_invalid",
        "Das ZIP-Bildpaket darf nicht leer sein.",
        relativePath,
      );
    await handle.sync();
    await handle.close();
    try {
      await link(temporary, target);
    } catch (error) {
      if (isAlreadyExistsError(error))
        throw new CardImageInboxError(
          "inbox_upload_exists",
          `Das ZIP-Bildpaket ${relativePath} existiert bereits.`,
          relativePath,
        );
      throw error;
    }
    await rm(temporary, { force: true }).catch(() => undefined);
    return { relativePath, kind: "file", usage: "pack-archive", bytes };
  } catch (error) {
    await handle.close().catch(() => undefined);
    await rm(temporary, { force: true });
    throw error;
  }
}

export async function inventoryCardImageInbox(
  options: CardImageInboxOptions = {},
): Promise<CardImageInboxInventory> {
  const root = await ensureInboxRoot(options);
  const entries: CardImageInboxEntry[] = [];
  await walkInbox(root, "", 0, entries);
  return {
    schemaVersion: "netgrid-card-image-inbox-v1",
    entries: entries.sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    ),
  };
}

export async function resolveCardImageInboxEntry(
  relativePath: string,
  expectedKind: "file" | "directory",
  options: CardImageInboxOptions = {},
): Promise<string> {
  const safeRelativePath = validateRelativeInboxPath(relativePath);
  const root = await ensureInboxRoot(options);
  const candidate = path.resolve(root, ...safeRelativePath.split("/"));
  assertWithinRoot(root, candidate, safeRelativePath);
  let info;
  try {
    info = await lstat(candidate);
  } catch (error) {
    if (isMissingFileError(error))
      throw new CardImageInboxError(
        "inbox_entry_missing",
        `Inbox-Eintrag ${safeRelativePath} wurde nicht gefunden.`,
        safeRelativePath,
      );
    throw error;
  }
  if (info.isSymbolicLink())
    throw new CardImageInboxError(
      "inbox_symlink_forbidden",
      `Inbox-Eintrag ${safeRelativePath} darf kein Symlink sein.`,
      safeRelativePath,
    );
  if (
    (expectedKind === "file" && !info.isFile()) ||
    (expectedKind === "directory" && !info.isDirectory())
  )
    throw new CardImageInboxError(
      "inbox_entry_type_invalid",
      `Inbox-Eintrag ${safeRelativePath} besitzt nicht den erwarteten Typ.`,
      safeRelativePath,
    );
  const canonicalRoot = await realpath(root);
  const canonicalCandidate = await realpath(candidate);
  assertWithinRoot(canonicalRoot, canonicalCandidate, safeRelativePath);
  return canonicalCandidate;
}

export async function resolveCardImageInboxSource(
  source: string,
  mappingDirectory: string,
  options: CardImageInboxOptions = {},
): Promise<string> {
  const root = await ensureInboxRoot(options);
  const candidate = path.isAbsolute(source)
    ? path.resolve(source)
    : path.resolve(mappingDirectory, source);
  const relative = path.relative(root, candidate).split(path.sep).join("/");
  return resolveCardImageInboxEntry(relative, "file", options);
}

export async function inventoryCardImageCollection(
  options: {
    collectionId?: string;
    store?: CardImageStore;
    cards?: readonly CatalogCard[];
  } = {},
): Promise<CardImageCollectionInventory> {
  const collectionId = options.collectionId ?? "personal";
  const store = options.store ?? new CardImageStore();
  const cards = options.cards ?? Object.values(createRuntimeCardsById());
  const collection = await store.readCollection(collectionId);
  const bindings = new Set(Object.keys(collection.bindings));
  const catalogPrintingIds = new Set(cards.map((card) => card.printingId));
  const sets = Object.values(PRIVATE_CARD_IMAGE_PACK_PROFILES).map(
    (profile) => {
      const setCards = cards
        .filter((card) => card.setId === profile.setId)
        .sort((left, right) => left.printingId.localeCompare(right.printingId));
      const missingPrintingIds = setCards
        .filter((card) => !bindings.has(card.printingId))
        .map((card) => card.printingId);
      return {
        profileId: profile.profileId,
        displayName: profile.displayName,
        setId: profile.setId,
        total: setCards.length,
        bound: setCards.length - missingPrintingIds.length,
        missing: missingPrintingIds.length,
        missingPrintingIds,
      } satisfies CardImageSetInventory;
    },
  );
  return {
    schemaVersion: "netgrid-card-image-collection-inventory-v1",
    collectionId,
    revision: collection.revision,
    totalBindings: bindings.size,
    unknownBindings: [...bindings].filter(
      (printingId) => !catalogPrintingIds.has(printingId),
    ).length,
    sets,
  };
}

async function walkInbox(
  root: string,
  relativeDirectory: string,
  depth: number,
  entries: CardImageInboxEntry[],
): Promise<void> {
  if (depth > MAX_INBOX_DEPTH)
    throw new CardImageInboxError(
      "inbox_too_large",
      "Die Kartenbild-Inbox ist zu tief verschachtelt.",
    );
  const directory = relativeDirectory
    ? path.join(root, ...relativeDirectory.split("/"))
    : root;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${entry.name}`
      : entry.name;
    if (entries.length >= MAX_INBOX_ENTRIES)
      throw new CardImageInboxError(
        "inbox_too_large",
        `Die Kartenbild-Inbox enthält mehr als ${MAX_INBOX_ENTRIES} Einträge.`,
      );
    if (entry.isSymbolicLink())
      throw new CardImageInboxError(
        "inbox_symlink_forbidden",
        `Inbox-Eintrag ${relativePath} darf kein Symlink sein.`,
        relativePath,
      );
    if (entry.isDirectory()) {
      const pack = await isPackDirectory(directory, entry.name);
      entries.push({
        relativePath,
        kind: "directory",
        usage: pack ? "pack" : "directory",
      });
      await walkInbox(root, relativePath, depth + 1, entries);
      continue;
    }
    if (!entry.isFile())
      throw new CardImageInboxError(
        "inbox_entry_type_invalid",
        `Inbox-Eintrag ${relativePath} ist weder Datei noch Verzeichnis.`,
        relativePath,
      );
    const info = await lstat(path.join(directory, entry.name));
    entries.push({
      relativePath,
      kind: "file",
      usage: fileUsage(entry.name),
      bytes: info.size,
    });
  }
}

async function isPackDirectory(parent: string, name: string): Promise<boolean> {
  try {
    const info = await lstat(
      path.join(parent, name, CARD_IMAGE_PACK_MANIFEST_FILE),
    );
    if (info.isSymbolicLink())
      throw new CardImageInboxError(
        "inbox_symlink_forbidden",
        "Ein Paketmanifest darf kein Symlink sein.",
      );
    return info.isFile();
  } catch (error) {
    if (isMissingFileError(error)) return false;
    throw error;
  }
}

function fileUsage(fileName: string): CardImageInboxEntry["usage"] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".zip")) return "pack-archive";
  if (lower.endsWith(".csv")) return "mapping";
  if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp")
  )
    return "image";
  return "other";
}

function isAllowedPackageUploadFile(relativePath: string): boolean {
  if (
    relativePath === CARD_IMAGE_PACK_MANIFEST_FILE ||
    relativePath === "mapping.csv"
  )
    return true;
  return /^images\/[a-z0-9][a-z0-9_-]{0,191}\.(?:png|jpe?g|webp)$/i.test(
    relativePath,
  );
}

async function ensureInboxRoot(
  options: CardImageInboxOptions,
): Promise<string> {
  const root = path.resolve(
    options.inboxRoot ?? resolveNetgridCardImageImportInboxRoot(options),
  );
  await mkdir(root, { recursive: true });
  const info = await lstat(root);
  if (info.isSymbolicLink() || !info.isDirectory())
    throw new CardImageInboxError(
      info.isSymbolicLink()
        ? "inbox_symlink_forbidden"
        : "inbox_entry_type_invalid",
      "Die Kartenbild-Inbox muss ein reguläres Verzeichnis sein.",
    );
  return root;
}

function validateRelativeInboxPath(value: string): string {
  const trimmed = value.trim();
  if (
    !trimmed ||
    path.isAbsolute(trimmed) ||
    trimmed.includes("\\") ||
    trimmed.includes("\0")
  )
    throw invalidInboxEntry(trimmed);
  const segments = trimmed.split("/");
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes(":"),
    )
  )
    throw invalidInboxEntry(trimmed);
  return segments.join("/");
}

function assertWithinRoot(
  root: string,
  candidate: string,
  relativePath: string,
): void {
  const relative = path.relative(root, candidate);
  if (
    !relative ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  )
    return;
  throw invalidInboxEntry(relativePath);
}

function invalidInboxEntry(relativePath: string): CardImageInboxError {
  return new CardImageInboxError(
    "inbox_entry_invalid",
    "Der Kartenbild-Inbox-Eintrag ist ungültig oder verlässt die verwaltete Inbox.",
    relativePath || undefined,
  );
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function isAlreadyExistsError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "EEXIST"
  );
}
