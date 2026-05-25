import profilesData from "../../../data/decks/deck-format-profiles-0.8.json";
import profilesData130 from "../../../data/decks/deck-format-profiles-1.3.0.json";
import snapshotsData from "../../../data/decks/deck-snapshots-0.8.json";
import aiDeckPoolData from "../../../data/ai/ai-deck-pool-1.0.1.json";
import { createHash } from "node:crypto";
import { createRuntimeCardsById } from "@netgrid/catalog";
import { buildEngineDeck, validateDeckSnapshot, type DeckFormatProfile, type DeckSnapshot, type DeckValidationContext } from "@netgrid/decks";
import type { ApiMatchCardPool } from "@netgrid/shared";

export type SeriesPlayerSlot = "player_a" | "player_b";
export type AiDeckPolicy = "fixed" | "selected" | "seeded_random";
export type MatchCardPool = ApiMatchCardPool;

export type ParticipantDeckPairInput = {
  runnerDeckSnapshotId?: string;
  corpDeckSnapshotId?: string;
  runnerDeckSnapshot?: DeckSnapshot;
  corpDeckSnapshot?: DeckSnapshot;
};

export type MatchDeckSelectionInput = {
  runnerDeckSnapshotId?: string;
  corpDeckSnapshotId?: string;
  runnerDeckSnapshot?: DeckSnapshot;
  corpDeckSnapshot?: DeckSnapshot;
  participantADecks?: ParticipantDeckPairInput;
  participantBDecks?: ParticipantDeckPairInput;
  aiDeckPolicy?: AiDeckPolicy;
};

export type ResolvedDeckSetup = {
  runnerSnapshot: DeckSnapshot;
  corpSnapshot: DeckSnapshot;
  runnerDeck: ReturnType<typeof buildEngineDeck>;
  corpDeck: ReturnType<typeof buildEngineDeck>;
};

export type ResolvedParticipantDeckPair = {
  runnerSnapshot: DeckSnapshot;
  corpSnapshot: DeckSnapshot;
  runnerDeck: ReturnType<typeof buildEngineDeck>;
  corpDeck: ReturnType<typeof buildEngineDeck>;
};

export type ResolvedParticipantDeckSetup = Record<SeriesPlayerSlot, ResolvedParticipantDeckPair>;

const DEFAULT_RUNNER_SNAPSHOT_ID = "demo_runner_008_snapshot_v0_8";
const DEFAULT_CORP_SNAPSHOT_ID = "demo_corp_008_snapshot_v0_8";
const PROTEUS_PLAYTEST_PROFILE_ID = "netgrid_private_local_proteus_playtest_v1";
const cardsById = createRuntimeCardsById() as DeckValidationContext["cardsById"];
const profiles = [...(profilesData.profiles as DeckFormatProfile[]), ...(profilesData130.profiles as DeckFormatProfile[])];
const frozenSnapshots = snapshotsData.snapshots as DeckSnapshot[];
const aiDeckPool = aiDeckPoolData.entries as Array<{ snapshotId: string; side: "runner" | "corp"; tags: string[] }>;

export function resolveDeckSetup(input: MatchDeckSelectionInput = {}, options: { seed?: string; aiDeckPolicy?: AiDeckPolicy; cardPool?: MatchCardPool } = {}): ResolvedDeckSetup {
  if (options.aiDeckPolicy === "fixed") return pairToDeckSetup(resolveParticipantPair({}, options.cardPool));
  if (options.aiDeckPolicy === "seeded_random") {
    return pairToDeckSetup(
      resolveParticipantPair({
        runnerDeckSnapshotId: deterministicSnapshotId("runner", options.seed ?? "seeded-random", "runner"),
        corpDeckSnapshotId: deterministicSnapshotId("corp", options.seed ?? "seeded-random", "corp")
      }, options.cardPool)
    );
  }
  return pairToDeckSetup(resolveParticipantPair(input, options.cardPool));
}

export function resolveParticipantDeckSetup(
  input: MatchDeckSelectionInput = {},
  options: { seed: string; aiPlayer?: SeriesPlayerSlot; aiDeckPolicy?: AiDeckPolicy; cardPool?: MatchCardPool } = { seed: "default" }
): ResolvedParticipantDeckSetup {
  const policy = options.aiDeckPolicy ?? input.aiDeckPolicy ?? "selected";
  const legacyPair: ParticipantDeckPairInput = {
    ...(input.runnerDeckSnapshotId ? { runnerDeckSnapshotId: input.runnerDeckSnapshotId } : {}),
    ...(input.corpDeckSnapshotId ? { corpDeckSnapshotId: input.corpDeckSnapshotId } : {}),
    ...(input.runnerDeckSnapshot ? { runnerDeckSnapshot: input.runnerDeckSnapshot } : {}),
    ...(input.corpDeckSnapshot ? { corpDeckSnapshot: input.corpDeckSnapshot } : {})
  };
  const setup: ResolvedParticipantDeckSetup = {
    player_a: resolveParticipantPair(deckInputForPlayer("player_a", input.participantADecks ?? legacyPair, options.seed, options.aiPlayer, policy), options.cardPool),
    player_b: resolveParticipantPair(deckInputForPlayer("player_b", input.participantBDecks ?? legacyPair, options.seed, options.aiPlayer, policy), options.cardPool)
  };
  if (options.aiPlayer && !participantPairUsesAiSupportedCards(setup[options.aiPlayer])) throw new Error("ai_deck_snapshot_not_supported");
  return setup;
}

export function deckSetupForParticipants(
  participants: ResolvedParticipantDeckSetup,
  assignment: { runnerPlayer: SeriesPlayerSlot; corpPlayer: SeriesPlayerSlot }
): ResolvedDeckSetup {
  const runnerOwner = participants[assignment.runnerPlayer];
  const corpOwner = participants[assignment.corpPlayer];
  return pairToDeckSetup({
    runnerSnapshot: runnerOwner.runnerSnapshot,
    corpSnapshot: corpOwner.corpSnapshot,
    runnerDeck: runnerOwner.runnerDeck,
    corpDeck: corpOwner.corpDeck
  });
}

export function resolveParticipantDeckPair(input: ParticipantDeckPairInput, options: { cardPool?: MatchCardPool } = {}): ResolvedParticipantDeckPair {
  return resolveParticipantPair(input, options.cardPool);
}

function pairToDeckSetup(pair: ResolvedParticipantDeckPair): ResolvedDeckSetup {
  return {
    runnerSnapshot: pair.runnerSnapshot,
    corpSnapshot: pair.corpSnapshot,
    runnerDeck: pair.runnerDeck,
    corpDeck: pair.corpDeck
  };
}

function resolveParticipantPair(input: ParticipantDeckPairInput, cardPool: MatchCardPool | undefined): ResolvedParticipantDeckPair {
  const runnerSnapshot = resolveSnapshot("runner", input.runnerDeckSnapshot, input.runnerDeckSnapshotId, DEFAULT_RUNNER_SNAPSHOT_ID, cardPool);
  const corpSnapshot = resolveSnapshot("corp", input.corpDeckSnapshot, input.corpDeckSnapshotId, DEFAULT_CORP_SNAPSHOT_ID, cardPool);
  return {
    runnerSnapshot,
    corpSnapshot,
    runnerDeck: buildEngineDeck(runnerSnapshot),
    corpDeck: buildEngineDeck(corpSnapshot)
  };
}

function deckInputForPlayer(
  player: SeriesPlayerSlot,
  selected: ParticipantDeckPairInput,
  seed: string,
  aiPlayer: SeriesPlayerSlot | undefined,
  policy: AiDeckPolicy
): ParticipantDeckPairInput {
  if (player !== aiPlayer) return selected;
  if (policy === "fixed") return {};
  if (policy === "seeded_random") {
    return {
      runnerDeckSnapshotId: deterministicSnapshotId("runner", seed, `${player}:runner`),
      corpDeckSnapshotId: deterministicSnapshotId("corp", seed, `${player}:corp`)
    };
  }
  return selected;
}

export function defaultAgendaPointsToWin(_setup: ResolvedDeckSetup): number {
  return 7;
}

function resolveSnapshot(side: "runner" | "corp", supplied: DeckSnapshot | undefined, requestedId: string | undefined, fallbackId: string, cardPool: MatchCardPool | undefined): DeckSnapshot {
  const snapshot = supplied ?? frozenSnapshots.find((candidate) => candidate.deckSnapshotId === (requestedId || fallbackId));
  if (!snapshot) throw new Error("deck_snapshot_not_found");
  if (snapshot.side !== side) throw new Error("deck_snapshot_wrong_side");
  if (!snapshotAllowedForCardPool(snapshot, cardPool ?? "originalset")) throw new Error("deck_snapshot_card_pool_mismatch");
  if (!snapshot.validation.ok) throw new Error("deck_snapshot_not_validated");
  const profile = profiles.find((candidate) => candidate.profileId === snapshot.formatProfileId);
  if (!profile) throw new Error("deck_format_profile_not_found");
  const validation = validateDeckSnapshot(snapshot, { cardsById, profile });
  if (!validation.ok) throw new Error("deck_snapshot_invalid");
  if (snapshot.formatProfileId === "netgrid_private_local_v1" && (!snapshot.formatProfileVersion || !snapshot.cardPoolVersion)) throw new Error("deck_snapshot_needs_revalidation");
  return structuredClone(snapshot) as DeckSnapshot;
}

function snapshotAllowedForCardPool(snapshot: DeckSnapshot, cardPool: MatchCardPool): boolean {
  if (cardPool === "originalset_proteus") return true;
  if (snapshot.formatProfileId === PROTEUS_PLAYTEST_PROFILE_ID) return false;
  return snapshot.cards.every((entry) => !entry.cardId.startsWith("onr_proteus_"));
}

function deterministicSnapshotId(side: "runner" | "corp", seed: string, salt: string): string {
  const candidates = frozenSnapshots
    .filter((candidate) => candidate.side === side && candidate.validation.ok && aiDeckPool.some((entry) => entry.side === side && entry.snapshotId === candidate.deckSnapshotId) && snapshotUsesAiSupportedCards(candidate))
    .map((candidate) => candidate.deckSnapshotId)
    .sort();
  if (candidates.length === 0) return side === "runner" ? DEFAULT_RUNNER_SNAPSHOT_ID : DEFAULT_CORP_SNAPSHOT_ID;
  const digest = createHash("sha256").update(`${seed}:${salt}`).digest();
  const value = digest.readUInt32BE(0);
  return candidates[value % candidates.length]!;
}

function snapshotUsesAiSupportedCards(snapshot: DeckSnapshot): boolean {
  return snapshot.cards.every((entry) => cardsById[entry.cardId]?.statuses.ai_supported === true);
}

function participantPairUsesAiSupportedCards(pair: ResolvedParticipantDeckPair): boolean {
  return snapshotUsesAiSupportedCards(pair.runnerSnapshot) && snapshotUsesAiSupportedCards(pair.corpSnapshot);
}
