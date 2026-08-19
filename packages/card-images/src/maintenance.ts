import { lstat, mkdir, readdir, realpath } from "node:fs/promises";
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

const MAX_INBOX_ENTRIES = 4_096;
const MAX_INBOX_DEPTH = 12;

export type CardImageInboxErrorCode =
  | "inbox_entry_invalid"
  | "inbox_entry_missing"
  | "inbox_entry_type_invalid"
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
  usage: "mapping" | "image" | "pack" | "directory" | "other";
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
