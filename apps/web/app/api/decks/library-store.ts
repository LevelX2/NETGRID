import { randomUUID } from "node:crypto";
import {
  isCardDefinitionId,
  runtimeProfileFromEnvironment,
} from "@netgrid/shared";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { homedir } from "node:os";
import {
  isDeckCardEntry,
  isDeckTableLayout,
  type EditableDeck,
} from "@netgrid/decks";
import {
  FileWriteLockBusyError,
  withFileWriteLock,
} from "@netgrid/card-images/file-write-lock";
import { resolveNetgridDataRoot } from "@netgrid/card-images/paths";
import { isCuratedLegacyDeckId } from "../../../features/decks/deck-library-visibility";

const LIBRARY_SCHEMA_VERSION = "netgrid-editable-deck-v1";
const PRIVATE_LOCAL_PROFILE_ID = "netgrid_private_local_v1";
const PRIVATE_LOCAL_PROFILE_VERSION = "1.3.0";
const PRIVATE_LOCAL_CARD_POOL_VERSION = "private-local-onr-v1";

type DeckLibraryFile = {
  schemaVersion: typeof LIBRARY_SCHEMA_VERSION;
  deck: EditableDeck;
};

export type DeckLibraryReadResult = {
  decks: EditableDeck[];
  storagePath: string;
};

export class DeckLibraryMutationError extends Error {
  readonly name = "DeckLibraryMutationError";

  constructor(
    readonly code:
      | "deck_library_payload_invalid"
      | "deck_library_file_conflict"
      | "deck_library_busy",
    message: string,
  ) {
    super(message);
  }
}

export function defaultDeckLibraryPath(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const configuredPath = env.NETGRID_DECK_LIBRARY_PATH;
  if (runtimeProfileFromEnvironment(env) === "release") {
    if (!env.NETGRID_DATA_ROOT?.trim())
      throw new Error("release_data_root_required");
    const dataRoot = resolveNetgridDataRoot({ env });
    if (!configuredPath) return join(dataRoot, "runtime", "decks");
    const libraryPath = resolve(configuredPath);
    const inside = relative(dataRoot, libraryPath);
    if (
      !isAbsolute(configuredPath) ||
      inside === "" ||
      inside === ".." ||
      inside.startsWith(`..${sep}`) ||
      isAbsolute(inside)
    )
      throw new Error("release_deck_library_outside_data_root");
    return libraryPath;
  }
  if (configuredPath) return resolve(configuredPath);
  if (env.APPDATA) return join(env.APPDATA, "NetGrid", "Decks");
  if (env.XDG_DATA_HOME) return join(env.XDG_DATA_HOME, "netgrid", "decks");
  return join(homedir(), ".netgrid", "decks");
}

export async function readDeckLibrary(
  storagePath = defaultDeckLibraryPath(),
): Promise<DeckLibraryReadResult> {
  await mkdir(storagePath, { recursive: true });
  const entries = await readdir(storagePath, { withFileTypes: true });
  const decks: EditableDeck[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const raw = await readDeckFile(join(storagePath, entry.name));
    const deck = raw === undefined ? undefined : storedDeck(raw);
    if (deck) decks.push(markRevalidationIfNeeded(deck));
  }
  decks.sort(
    (left, right) =>
      left.updatedAt.localeCompare(right.updatedAt) ||
      left.name.localeCompare(right.name),
  );
  return { decks, storagePath };
}

export async function saveLibraryDeck(
  value: unknown,
  storagePath = defaultDeckLibraryPath(),
): Promise<{ deck: EditableDeck; storagePath: string }> {
  if (!isEditableDeck(value)) throw invalidDeckPayload();
  const deck = {
    ...markRevalidationIfNeeded(value),
    name: value.name.slice(0, 120),
    cards: [...value.cards].sort((left, right) => left.cardId - right.cardId),
  };
  const fileName = deckFileName(deck.deckId);
  const target = join(storagePath, fileName);
  await withDeckWriteLock(target, async () => {
    await checkDeckFileOwner(target, deck.deckId);
    const temporary = join(storagePath, `.${fileName}.${randomUUID()}.tmp`);
    const payload: DeckLibraryFile = {
      schemaVersion: LIBRARY_SCHEMA_VERSION,
      deck,
    };
    try {
      await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, {
        encoding: "utf8",
        flag: "wx",
      });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
  });
  return { deck, storagePath };
}

export async function deleteLibraryDeck(
  deckId: unknown,
  storagePath = defaultDeckLibraryPath(),
): Promise<{ deckId: string; storagePath: string }> {
  if (typeof deckId !== "string") throw invalidDeckPayload();
  const target = join(storagePath, deckFileName(deckId));
  await withDeckWriteLock(target, async () => {
    if (await checkDeckFileOwner(target, deckId))
      await rm(target, { force: true });
  });
  return { deckId, storagePath };
}

async function withDeckWriteLock(target: string, write: () => Promise<void>) {
  try {
    await withFileWriteLock(target, write);
  } catch (error) {
    if (!(error instanceof FileWriteLockBusyError)) throw error;
    throw new DeckLibraryMutationError(
      "deck_library_busy",
      "Die Deckdatei wird bereits aktualisiert.",
    );
  }
}

async function checkDeckFileOwner(
  target: string,
  deckId: string,
): Promise<boolean> {
  const raw = await readDeckFile(target);
  if (raw === undefined) return false;
  if (storedDeck(raw)?.deckId !== deckId)
    throw new DeckLibraryMutationError(
      "deck_library_file_conflict",
      "Der Dateiname ist durch einen anderen oder ungültigen Eintrag belegt.",
    );
  return true;
}

async function readDeckFile(target: string): Promise<string | undefined> {
  try {
    return await readFile(target, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function storedDeck(raw: string): EditableDeck | undefined {
  try {
    const file = JSON.parse(raw) as Partial<DeckLibraryFile> | null;
    if (
      file?.schemaVersion === LIBRARY_SCHEMA_VERSION &&
      isEditableDeck(file.deck)
    )
      return file.deck;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }
  return undefined;
}

function markRevalidationIfNeeded(deck: EditableDeck): EditableDeck {
  return { ...deck, ...revalidationFields(deck) };
}

function revalidationFields(deck: EditableDeck): Partial<EditableDeck> {
  if (deck.formatProfileId !== PRIVATE_LOCAL_PROFILE_ID)
    return { validationStatus: "needs_revalidation" };
  if (
    deck.formatProfileVersion !== PRIVATE_LOCAL_PROFILE_VERSION ||
    deck.cardPoolVersion !== PRIVATE_LOCAL_CARD_POOL_VERSION
  ) {
    return {
      formatProfileVersion:
        deck.formatProfileVersion ?? PRIVATE_LOCAL_PROFILE_VERSION,
      cardPoolVersion: deck.cardPoolVersion ?? PRIVATE_LOCAL_CARD_POOL_VERSION,
      validationStatus: "needs_revalidation",
    };
  }
  return deck.validationStatus
    ? { validationStatus: deck.validationStatus }
    : {};
}

function isEditableDeck(value: unknown): value is EditableDeck {
  const deck = value as Partial<EditableDeck> | null;
  return Boolean(
    deck &&
    typeof deck.deckId === "string" &&
    typeof deck.deckVersion === "string" &&
    typeof deck.name === "string" &&
    deck.name.trim().length > 0 &&
    (deck.side === "runner" || deck.side === "corp") &&
    isCardDefinitionId(deck.identityCardId) &&
    typeof deck.cardPoolSnapshotId === "string" &&
    (deck.cardPoolVersion === undefined ||
      typeof deck.cardPoolVersion === "string") &&
    typeof deck.formatProfileId === "string" &&
    (deck.formatProfileVersion === undefined ||
      typeof deck.formatProfileVersion === "string") &&
    (deck.validationStatus === undefined ||
      ["valid", "invalid", "needs_revalidation"].includes(
        deck.validationStatus,
      )) &&
    (deck.notes === undefined || typeof deck.notes === "string") &&
    Array.isArray(deck.cards) &&
    deck.cards.every(isDeckCardEntry) &&
    (deck.tableLayout === undefined || isDeckTableLayout(deck.tableLayout)) &&
    typeof deck.createdAt === "string" &&
    typeof deck.updatedAt === "string",
  );
}

function deckFileName(deckId: string): string {
  if (!deckId.trim() || isCuratedLegacyDeckId(deckId))
    throw invalidDeckPayload();
  const stem = deckId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(stem))
    throw invalidDeckPayload();
  return `${stem}.json`;
}

function invalidDeckPayload(): DeckLibraryMutationError {
  return new DeckLibraryMutationError(
    "deck_library_payload_invalid",
    "Das Deck enthält ungültige Daten.",
  );
}
