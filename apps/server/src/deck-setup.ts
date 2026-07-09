import profilesData from "../../../data/decks/deck-format-profiles-0.8.json";
import profilesData130 from "../../../data/decks/deck-format-profiles-1.3.0.json";
import snapshotsData from "../../../data/decks/deck-snapshots-0.8.json";
import aiDeckPoolData from "../../../data/ai/ai-deck-pool-1.1.0.json";
import { createHash } from "node:crypto";
import {
  aiSupportStageReady,
  createRuntimeCardsById,
  type AiSupportReadinessStage,
} from "@netgrid/catalog";
import {
  buildEngineDeck,
  validateDeckSnapshot,
  type DeckFormatProfile,
  type DeckSnapshot,
  type DeckValidationContext,
} from "@netgrid/decks";
import type { ApiMatchCardPool } from "@netgrid/shared";

export type SeriesPlayerSlot = "player_a" | "player_b";
export type AiDeckPolicy =
  | "fixed"
  | "selected"
  | "seeded_random"
  | "same_as_participant_a";
export type MatchCardPool = ApiMatchCardPool;

export type ParticipantDeckPairInput = {
  runnerDeckSnapshotId?: string;
  corpDeckSnapshotId?: string;
  runnerDeckSnapshot?: DeckSnapshot;
  corpDeckSnapshot?: DeckSnapshot;
};

export type MatchDeckSelectionInput = {
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

export type ResolvedParticipantDeckSetup = Record<
  SeriesPlayerSlot,
  ResolvedParticipantDeckPair
>;

const DEFAULT_RUNNER_SNAPSHOT_ID = "demo_runner_008_snapshot_v0_8";
const DEFAULT_CORP_SNAPSHOT_ID = "demo_corp_008_snapshot_v0_8";
const CLASSIC_PLAYTEST_PROFILE_ID = "netgrid_private_local_classic_playtest_v1";
const PROTEUS_PLAYTEST_PROFILE_ID = "netgrid_private_local_proteus_playtest_v1";
const CLASSIC_PROTEUS_PLAYTEST_PROFILE_ID =
  "netgrid_private_local_classic_proteus_playtest_v1";
const cardsById =
  createRuntimeCardsById() as DeckValidationContext["cardsById"];
const profiles = [
  ...(profilesData.profiles as DeckFormatProfile[]),
  ...(profilesData130.profiles as DeckFormatProfile[]),
];
const frozenSnapshots = snapshotsData.snapshots as DeckSnapshot[];
const aiDeckPool = aiDeckPoolData.entries as Array<{
  snapshotId: string;
  side: "runner" | "corp";
  tags: string[];
}>;

export function resolveDeckSetup(
  input: ParticipantDeckPairInput = {},
  options: {
    seed?: string;
    aiDeckPolicy?: AiDeckPolicy;
    cardPool?: MatchCardPool;
  } = {},
): ResolvedDeckSetup {
  if (options.aiDeckPolicy === "fixed")
    return pairToDeckSetup(
      resolveParticipantPair(
        fixedDeckInput(options.cardPool),
        options.cardPool,
      ),
    );
  if (options.aiDeckPolicy === "seeded_random") {
    return pairToDeckSetup(
      resolveParticipantPair(
        {
          runnerDeckSnapshotId: deterministicSnapshotId(
            "runner",
            options.seed ?? "seeded-random",
            "runner",
            options.cardPool,
          ),
          corpDeckSnapshotId: deterministicSnapshotId(
            "corp",
            options.seed ?? "seeded-random",
            "corp",
            options.cardPool,
          ),
        },
        options.cardPool,
      ),
    );
  }
  return pairToDeckSetup(resolveParticipantPair(input, options.cardPool));
}

export function resolveParticipantDeckSetup(
  input: MatchDeckSelectionInput = {},
  options: {
    seed: string;
    aiPlayer?: SeriesPlayerSlot;
    aiDeckPolicy?: AiDeckPolicy;
    cardPool?: MatchCardPool;
  } = { seed: "default" },
): ResolvedParticipantDeckSetup {
  const policy = options.aiDeckPolicy ?? input.aiDeckPolicy ?? "selected";
  const participantAInput = input.participantADecks ?? {};
  const setup: ResolvedParticipantDeckSetup = {
    player_a: resolveParticipantPair(
      deckInputForPlayer(
        "player_a",
        participantAInput,
        participantAInput,
        options.seed,
        options.aiPlayer,
        policy,
        options.cardPool,
      ),
      options.cardPool,
    ),
    player_b: resolveParticipantPair(
      deckInputForPlayer(
        "player_b",
        input.participantBDecks ?? {},
        participantAInput,
        options.seed,
        options.aiPlayer,
        policy,
        options.cardPool,
      ),
      options.cardPool,
    ),
  };
  if (options.aiPlayer) {
    const aiPair = setup[options.aiPlayer];
    if (!participantPairUsesAiSupportedCards(aiPair)) {
      throw new Error("ai_deck_snapshot_not_supported");
    }
    assertAiPairReadiness(aiPair, policy);
  }
  return setup;
}

export function deckSetupForParticipants(
  participants: ResolvedParticipantDeckSetup,
  assignment: { runnerPlayer: SeriesPlayerSlot; corpPlayer: SeriesPlayerSlot },
): ResolvedDeckSetup {
  const runnerOwner = participants[assignment.runnerPlayer];
  const corpOwner = participants[assignment.corpPlayer];
  return pairToDeckSetup({
    runnerSnapshot: runnerOwner.runnerSnapshot,
    corpSnapshot: corpOwner.corpSnapshot,
    runnerDeck: runnerOwner.runnerDeck,
    corpDeck: corpOwner.corpDeck,
  });
}

export function resolveParticipantDeckPair(
  input: ParticipantDeckPairInput,
  options: { cardPool?: MatchCardPool } = {},
): ResolvedParticipantDeckPair {
  return resolveParticipantPair(input, options.cardPool);
}

function pairToDeckSetup(pair: ResolvedParticipantDeckPair): ResolvedDeckSetup {
  return {
    runnerSnapshot: pair.runnerSnapshot,
    corpSnapshot: pair.corpSnapshot,
    runnerDeck: pair.runnerDeck,
    corpDeck: pair.corpDeck,
  };
}

function resolveParticipantPair(
  input: ParticipantDeckPairInput,
  cardPool: MatchCardPool | undefined,
): ResolvedParticipantDeckPair {
  const runnerSnapshot = resolveSnapshot(
    "runner",
    input.runnerDeckSnapshot,
    input.runnerDeckSnapshotId,
    DEFAULT_RUNNER_SNAPSHOT_ID,
    cardPool,
  );
  const corpSnapshot = resolveSnapshot(
    "corp",
    input.corpDeckSnapshot,
    input.corpDeckSnapshotId,
    DEFAULT_CORP_SNAPSHOT_ID,
    cardPool,
  );
  return {
    runnerSnapshot,
    corpSnapshot,
    runnerDeck: buildEngineDeck(runnerSnapshot),
    corpDeck: buildEngineDeck(corpSnapshot),
  };
}

function deckInputForPlayer(
  player: SeriesPlayerSlot,
  selected: ParticipantDeckPairInput,
  participantAInput: ParticipantDeckPairInput,
  seed: string,
  aiPlayer: SeriesPlayerSlot | undefined,
  policy: AiDeckPolicy,
  cardPool: MatchCardPool | undefined,
): ParticipantDeckPairInput {
  if (player !== aiPlayer) return selected;
  if (policy === "fixed") return fixedDeckInput(cardPool);
  if (policy === "same_as_participant_a") return participantAInput;
  if (policy === "seeded_random") {
    return {
      runnerDeckSnapshotId: deterministicSnapshotId(
        "runner",
        seed,
        `${player}:runner`,
        cardPool,
      ),
      corpDeckSnapshotId: deterministicSnapshotId(
        "corp",
        seed,
        `${player}:corp`,
        cardPool,
      ),
    };
  }
  return selected;
}

export function defaultAgendaPointsToWin(_setup: ResolvedDeckSetup): number {
  return 7;
}

function resolveSnapshot(
  side: "runner" | "corp",
  supplied: DeckSnapshot | undefined,
  requestedId: string | undefined,
  fallbackId: string,
  cardPool: MatchCardPool | undefined,
): DeckSnapshot {
  const snapshot =
    supplied ??
    frozenSnapshots.find(
      (candidate) => candidate.deckSnapshotId === (requestedId || fallbackId),
    );
  if (!snapshot) throw new Error("deck_snapshot_not_found");
  if (snapshot.side !== side) throw new Error("deck_snapshot_wrong_side");
  if (!snapshotAllowedForCardPool(snapshot, cardPool ?? "originalset"))
    throw new Error("deck_snapshot_card_pool_mismatch");
  if (!snapshot.validation.ok) throw new Error("deck_snapshot_not_validated");
  const profile = profiles.find(
    (candidate) => candidate.profileId === snapshot.formatProfileId,
  );
  if (!profile) throw new Error("deck_format_profile_not_found");
  const validation = validateDeckSnapshot(snapshot, { cardsById, profile });
  if (!validation.ok) throw new Error("deck_snapshot_invalid");
  if (
    snapshot.formatProfileId === "netgrid_private_local_v1" &&
    (!snapshot.formatProfileVersion || !snapshot.cardPoolVersion)
  )
    throw new Error("deck_snapshot_needs_revalidation");
  return structuredClone(snapshot) as DeckSnapshot;
}

function snapshotAllowedForCardPool(
  snapshot: DeckSnapshot,
  cardPool: MatchCardPool,
): boolean {
  if (!profileAllowedForCardPool(snapshot.formatProfileId, cardPool))
    return false;
  return snapshot.cards.every((entry) =>
    cardIdAllowedForCardPool(entry.cardId, cardPool),
  );
}

function profileAllowedForCardPool(
  formatProfileId: string,
  cardPool: MatchCardPool,
): boolean {
  if (formatProfileId === CLASSIC_PLAYTEST_PROFILE_ID)
    return cardPoolIncludesClassic(cardPool);
  if (formatProfileId === PROTEUS_PLAYTEST_PROFILE_ID)
    return cardPoolIncludesProteus(cardPool);
  if (formatProfileId === CLASSIC_PROTEUS_PLAYTEST_PROFILE_ID)
    return (
      cardPoolIncludesClassic(cardPool) && cardPoolIncludesProteus(cardPool)
    );
  return true;
}

function cardIdAllowedForCardPool(
  cardId: string,
  cardPool: MatchCardPool,
): boolean {
  if (cardId.startsWith("onr_classic_") && !cardPoolIncludesClassic(cardPool))
    return false;
  if (cardId.startsWith("onr_proteus_") && !cardPoolIncludesProteus(cardPool))
    return false;
  return true;
}

function cardPoolIncludesClassic(cardPool: MatchCardPool): boolean {
  return (
    cardPool === "originalset_classic" ||
    cardPool === "originalset_classic_proteus"
  );
}

function cardPoolIncludesProteus(cardPool: MatchCardPool): boolean {
  return (
    cardPool === "originalset_proteus" ||
    cardPool === "originalset_classic_proteus"
  );
}

function deterministicSnapshotId(
  side: "runner" | "corp",
  seed: string,
  salt: string,
  cardPool?: MatchCardPool,
): string {
  const candidates = frozenSnapshots
    .filter(
      (candidate) =>
        candidate.side === side &&
        candidate.validation.ok &&
        snapshotAllowedForCardPool(candidate, cardPool ?? "originalset") &&
        aiDeckPool.some(
          (entry) =>
            entry.side === side &&
            entry.snapshotId === candidate.deckSnapshotId &&
            poolEntryAllowedForCardPool(entry, cardPool ?? "originalset"),
        ) &&
        snapshotUsesAiSupportedCards(candidate),
    )
    .map((candidate) => candidate.deckSnapshotId)
    .sort();
  if (candidates.length === 0)
    return side === "runner"
      ? DEFAULT_RUNNER_SNAPSHOT_ID
      : DEFAULT_CORP_SNAPSHOT_ID;
  const digest = createHash("sha256").update(`${seed}:${salt}`).digest();
  const value = digest.readUInt32BE(0);
  return candidates[value % candidates.length]!;
}

function fixedDeckInput(
  cardPool: MatchCardPool | undefined,
): ParticipantDeckPairInput {
  const effectivePool = cardPool ?? "originalset";
  const fixedTag =
    effectivePool === "originalset_classic"
      ? "fixed_classic"
      : effectivePool === "originalset_proteus"
        ? "fixed_proteus"
        : effectivePool === "originalset_classic_proteus"
          ? "fixed_combined"
          : "fixed_originalset";
  const snapshotIdFor = (side: "runner" | "corp") =>
    aiDeckPool.find(
      (entry) => entry.side === side && entry.tags.includes(fixedTag),
    )?.snapshotId;
  return {
    runnerDeckSnapshotId: snapshotIdFor("runner") ?? DEFAULT_RUNNER_SNAPSHOT_ID,
    corpDeckSnapshotId: snapshotIdFor("corp") ?? DEFAULT_CORP_SNAPSHOT_ID,
  };
}

function poolEntryAllowedForCardPool(
  entry: (typeof aiDeckPool)[number],
  cardPool: MatchCardPool,
): boolean {
  if (cardPool === "originalset_proteus") return entry.tags.includes("proteus");
  if (cardPool === "originalset_classic") return entry.tags.includes("classic");
  if (cardPool === "originalset")
    return !entry.tags.includes("proteus") && !entry.tags.includes("classic");
  return true;
}

function snapshotUsesAiSupportedCards(snapshot: DeckSnapshot): boolean {
  return snapshot.cards.every(
    (entry) => cardsById[entry.cardId]?.statuses.ai_supported === true,
  );
}

function participantPairUsesAiSupportedCards(
  pair: ResolvedParticipantDeckPair,
): boolean {
  return (
    snapshotUsesAiSupportedCards(pair.runnerSnapshot) &&
    snapshotUsesAiSupportedCards(pair.corpSnapshot)
  );
}

function assertAiPairReadiness(
  pair: ResolvedParticipantDeckPair,
  policy: AiDeckPolicy,
): void {
  if (!participantPairUsesSet(pair, "onr_proteus_")) return;
  const requiredStage: AiSupportReadinessStage =
    policy === "fixed" || policy === "seeded_random"
      ? "default_pool_ready"
      : "selected_ai_playtest_ready";
  if (!aiSupportStageReady("proteus", requiredStage)) {
    throw new Error("ai_deck_readiness_stage_not_approved");
  }
}

function participantPairUsesSet(
  pair: ResolvedParticipantDeckPair,
  cardIdPrefix: string,
): boolean {
  return [pair.runnerSnapshot, pair.corpSnapshot].some((snapshot) =>
    snapshot.cards.some((entry) => entry.cardId.startsWith(cardIdPrefix)),
  );
}
