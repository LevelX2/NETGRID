import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import type { EditableDeck } from "@netgrid/decks";

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

export function defaultDeckLibraryPath(env: NodeJS.ProcessEnv = process.env): string {
  const configuredPath = env.NETGRID_DECK_LIBRARY_PATH ?? env.NETRUNNER_DECK_LIBRARY_PATH;
  if (configuredPath) return resolve(configuredPath);
  if (env.APPDATA) return join(env.APPDATA, "NetGrid", "Decks");
  if (env.XDG_DATA_HOME) return join(env.XDG_DATA_HOME, "netgrid", "decks");
  return join(homedir(), ".netgrid", "decks");
}

export async function readDeckLibrary(storagePath = defaultDeckLibraryPath()): Promise<DeckLibraryReadResult> {
  await mkdir(storagePath, { recursive: true });
  const entries = await readdir(storagePath, { withFileTypes: true });
  const decks: EditableDeck[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    try {
      const raw = await readFile(join(storagePath, entry.name), "utf8");
      const parsed = JSON.parse(raw) as Partial<DeckLibraryFile>;
      if (parsed.schemaVersion !== LIBRARY_SCHEMA_VERSION || !isEditableDeck(parsed.deck)) continue;
      decks.push(markRevalidationIfNeeded(parsed.deck));
    } catch {
      continue;
    }
  }
  decks.sort((left, right) => left.updatedAt.localeCompare(right.updatedAt) || left.name.localeCompare(right.name));
  return { decks, storagePath };
}

export async function writeDeckLibrary(decks: EditableDeck[], storagePath = defaultDeckLibraryPath()): Promise<DeckLibraryReadResult> {
  await mkdir(storagePath, { recursive: true });
  const normalized = normalizeDecks(decks);
  const nextFiles = new Set<string>();

  for (const deck of normalized) {
    const fileName = `${safeFileStem(deck.deckId)}.json`;
    nextFiles.add(fileName);
    const target = join(storagePath, fileName);
    const temp = join(storagePath, `${fileName}.tmp`);
    const payload: DeckLibraryFile = { schemaVersion: LIBRARY_SCHEMA_VERSION, deck };
    await writeFile(temp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    await rename(temp, target);
  }

  const existing = await readdir(storagePath, { withFileTypes: true });
  for (const entry of existing) {
    if (!entry.isFile() || !entry.name.endsWith(".json") || nextFiles.has(entry.name)) continue;
    await rm(join(storagePath, entry.name), { force: true });
  }

  return { decks: normalized, storagePath };
}

function normalizeDecks(decks: EditableDeck[]): EditableDeck[] {
  const byId = new Map<string, EditableDeck>();
  for (const deck of decks) {
    if (!isEditableDeck(deck)) continue;
    byId.set(deck.deckId, {
      ...deck,
      ...revalidationFields(deck),
      name: deck.name.slice(0, 120),
      cards: deck.cards
        .filter((entry) => typeof entry.cardId === "string" && Number.isFinite(entry.quantity))
        .map((entry) => ({ cardId: entry.cardId, quantity: Math.max(0, Math.floor(entry.quantity)) }))
        .filter((entry) => entry.quantity > 0)
        .sort((left, right) => left.cardId.localeCompare(right.cardId))
    });
  }
  return [...byId.values()].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt) || left.name.localeCompare(right.name));
}

function markRevalidationIfNeeded(deck: EditableDeck): EditableDeck {
  return { ...deck, ...revalidationFields(deck) };
}

function revalidationFields(deck: EditableDeck): Partial<EditableDeck> {
  if (deck.formatProfileId !== PRIVATE_LOCAL_PROFILE_ID) return { validationStatus: "needs_revalidation" };
  if (deck.formatProfileVersion !== PRIVATE_LOCAL_PROFILE_VERSION || deck.cardPoolVersion !== PRIVATE_LOCAL_CARD_POOL_VERSION) {
    return {
      formatProfileVersion: deck.formatProfileVersion ?? PRIVATE_LOCAL_PROFILE_VERSION,
      cardPoolVersion: deck.cardPoolVersion ?? PRIVATE_LOCAL_CARD_POOL_VERSION,
      validationStatus: "needs_revalidation"
    };
  }
  return deck.validationStatus ? { validationStatus: deck.validationStatus } : {};
}

function isEditableDeck(value: unknown): value is EditableDeck {
  const deck = value as Partial<EditableDeck> | null;
  return Boolean(
    deck &&
      typeof deck.deckId === "string" &&
      typeof deck.deckVersion === "string" &&
      typeof deck.name === "string" &&
      (deck.side === "runner" || deck.side === "corp") &&
      typeof deck.identityCardId === "string" &&
      typeof deck.cardPoolSnapshotId === "string" &&
      typeof deck.formatProfileId === "string" &&
      Array.isArray(deck.cards) &&
      typeof deck.createdAt === "string" &&
      typeof deck.updatedAt === "string"
  );
}

function safeFileStem(value: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return sanitized || "deck";
}
