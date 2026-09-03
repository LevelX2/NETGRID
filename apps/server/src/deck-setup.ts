import { aiDeckPoolData } from "@netgrid/runtime-data/ai-deck-pool";
import {
  deckFormatProfiles08Data as profilesData,
  deckFormatProfiles130Data as profilesData130,
} from "@netgrid/runtime-data/deck-format-profiles";
import { deckSnapshots08Data as snapshotsData } from "@netgrid/runtime-data/legacy-demo-decks";
import {
  PRODUCT_DEFAULT_CORP_SNAPSHOT_ID,
  PRODUCT_DEFAULT_RUNNER_SNAPSHOT_ID,
} from "@netgrid/runtime-data/product-default-decks";
import { standardDeckCatalogData } from "@netgrid/runtime-data/standard-decks";
import { createHash } from "node:crypto";
import {
  aiSupportStageReady,
  createRuntimeCardsById,
  type AiSupportReadinessStage,
} from "@netgrid/catalog";
import {
  buildEngineDeck,
  createDeckSnapshot,
  validateDeckSnapshot,
  type DeckCardEntry,
  type DeckFormatProfile,
  type DeckSnapshot,
  type DeckValidationContext,
  type EditableDeck,
} from "@netgrid/decks";
import {
  TEST_CARD_SET_ID,
  resolveTestCardAvailability,
  type ApiMatchCardPool,
  type StandardDeckGuideRef,
} from "@netgrid/shared";

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

const DEFAULT_RUNNER_SNAPSHOT_ID = PRODUCT_DEFAULT_RUNNER_SNAPSHOT_ID;
const DEFAULT_CORP_SNAPSHOT_ID = PRODUCT_DEFAULT_CORP_SNAPSHOT_ID;
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
const curatedStandardSnapshotBindings = curatedStandardSnapshots();
const frozenSnapshots = [
  ...(snapshotsData.snapshots as DeckSnapshot[]),
  ...curatedStandardSnapshotBindings.map((binding) => binding.snapshot),
];
const curatedStandardSnapshotBindingsById = new Map(
  curatedStandardSnapshotBindings.map((binding) => [
    binding.snapshot.deckSnapshotId,
    binding,
  ]),
);
const aiDeckPool = aiDeckPoolData.entries as Array<{
  snapshotId: string;
  side: "runner" | "corp";
  tags: string[];
}>;

type CuratedStandardDeck = {
  standardDeckId: string;
  version: string;
  status: "active";
  name: string;
  side: "runner" | "corp";
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  cards: DeckCardEntry[];
};

type CuratedStandardSnapshotBinding = {
  standardDeckId: string;
  snapshot: DeckSnapshot;
};

function curatedStandardSnapshots(): CuratedStandardSnapshotBinding[] {
  const curatedAt = `${standardDeckCatalogData.curatedAt}T00:00:00.000Z`;
  return (standardDeckCatalogData.decks as CuratedStandardDeck[])
    .filter((deck) => deck.status === "active")
    .flatMap((deck) => {
      const profile = [...profiles]
        .reverse()
        .find(
          (candidate) =>
            candidate.profileId === deck.formatProfileId &&
            (!deck.formatProfileVersion ||
              candidate.version === deck.formatProfileVersion),
        );
      if (!profile) {
        console.error(
          `Skipping standard deck ${deck.standardDeckId} (${deck.name}): format profile not found`,
        );
        return [];
      }
      const editable: EditableDeck = {
        deckId: deck.standardDeckId,
        deckVersion: "1",
        name: deck.name,
        side: deck.side,
        identityCardId: deck.identityCardId,
        cardPoolSnapshotId: deck.cardPoolSnapshotId,
        ...(deck.cardPoolVersion
          ? { cardPoolVersion: deck.cardPoolVersion }
          : {}),
        formatProfileId: deck.formatProfileId,
        ...(deck.formatProfileVersion
          ? { formatProfileVersion: deck.formatProfileVersion }
          : {}),
        cards: deck.cards.map((entry) => ({ ...entry })),
        createdAt: curatedAt,
        updatedAt: curatedAt,
      };
      const rulesBaselineId = profile.rulesBaselineIds[0];
      const snapshot = createDeckSnapshot(
        editable,
        { cardsById, profile },
        {
          snapshotId: `standard_${deck.standardDeckId}_${deck.version}`,
          ...(rulesBaselineId ? { rulesBaselineId } : {}),
        },
      );
      if (!snapshot.validation.ok) {
        console.error(
          `Skipping standard deck ${deck.standardDeckId} (${deck.name}): ${snapshot.validation.errors.join(" | ")}`,
        );
        return [];
      }
      return [{ standardDeckId: deck.standardDeckId, snapshot }];
    });
}

export function standardDeckGuideRefForSnapshot(
  snapshot: DeckSnapshot,
): StandardDeckGuideRef | undefined {
  const binding = curatedStandardSnapshotBindingsById.get(
    snapshot.deckSnapshotId,
  );
  if (
    !binding ||
    binding.snapshot.deckHash !== snapshot.deckHash ||
    binding.snapshot.sourceDeckId !== snapshot.sourceDeckId ||
    binding.snapshot.side !== snapshot.side
  ) {
    return undefined;
  }
  return { standardDeckId: binding.standardDeckId };
}

export function resolveDeckSetup(
  input: ParticipantDeckPairInput = {},
  options: {
    seed?: string;
    aiDeckPolicy?: AiDeckPolicy;
    cardPool?: MatchCardPool;
    allowTestCards?: boolean;
  } = {},
): ResolvedDeckSetup {
  if (options.aiDeckPolicy === "fixed")
    return pairToDeckSetup(
      resolveParticipantPair(
        fixedDeckInput(options.cardPool),
        options.cardPool,
        testCardAvailability(options.allowTestCards),
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
            testCardAvailability(options.allowTestCards),
          ),
          corpDeckSnapshotId: deterministicSnapshotId(
            "corp",
            options.seed ?? "seeded-random",
            "corp",
            options.cardPool,
            testCardAvailability(options.allowTestCards),
          ),
        },
        options.cardPool,
        testCardAvailability(options.allowTestCards),
      ),
    );
  }
  return pairToDeckSetup(
    resolveParticipantPair(
      input,
      options.cardPool,
      testCardAvailability(options.allowTestCards),
    ),
  );
}

export function resolveParticipantDeckSetup(
  input: MatchDeckSelectionInput = {},
  options: {
    seed: string;
    aiPlayer?: SeriesPlayerSlot;
    aiPlayers?: SeriesPlayerSlot[];
    aiDeckPolicy?: AiDeckPolicy;
    cardPool?: MatchCardPool;
    allowTestCards?: boolean;
  } = { seed: "default" },
): ResolvedParticipantDeckSetup {
  const policy = options.aiDeckPolicy ?? input.aiDeckPolicy ?? "selected";
  const aiPlayers =
    options.aiPlayers ?? (options.aiPlayer ? [options.aiPlayer] : []);
  const participantAInput = input.participantADecks ?? {};
  const setup: ResolvedParticipantDeckSetup = {
    player_a: resolveParticipantPair(
      deckInputForPlayer(
        "player_a",
        participantAInput,
        participantAInput,
        options.seed,
        aiPlayers.includes("player_a"),
        policy,
        options.cardPool,
        testCardAvailability(options.allowTestCards),
      ),
      options.cardPool,
      testCardAvailability(options.allowTestCards),
    ),
    player_b: resolveParticipantPair(
      deckInputForPlayer(
        "player_b",
        input.participantBDecks ?? {},
        participantAInput,
        options.seed,
        aiPlayers.includes("player_b"),
        policy,
        options.cardPool,
        testCardAvailability(options.allowTestCards),
      ),
      options.cardPool,
      testCardAvailability(options.allowTestCards),
    ),
  };
  for (const aiPlayer of aiPlayers) {
    const aiPair = setup[aiPlayer];
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
  options: { cardPool?: MatchCardPool; allowTestCards?: boolean } = {},
): ResolvedParticipantDeckPair {
  return resolveParticipantPair(
    input,
    options.cardPool,
    testCardAvailability(options.allowTestCards),
  );
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
  allowTestCards: boolean,
): ResolvedParticipantDeckPair {
  const runnerSnapshot = resolveSnapshot(
    "runner",
    input.runnerDeckSnapshot,
    input.runnerDeckSnapshotId,
    DEFAULT_RUNNER_SNAPSHOT_ID,
    cardPool,
    allowTestCards,
  );
  const corpSnapshot = resolveSnapshot(
    "corp",
    input.corpDeckSnapshot,
    input.corpDeckSnapshotId,
    DEFAULT_CORP_SNAPSHOT_ID,
    cardPool,
    allowTestCards,
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
  isAiPlayer: boolean,
  policy: AiDeckPolicy,
  cardPool: MatchCardPool | undefined,
  allowTestCards: boolean,
): ParticipantDeckPairInput {
  if (!isAiPlayer) return selected;
  if (policy === "fixed") return fixedDeckInput(cardPool);
  if (policy === "same_as_participant_a") return participantAInput;
  if (policy === "seeded_random") {
    return {
      runnerDeckSnapshotId: deterministicSnapshotId(
        "runner",
        seed,
        `${player}:runner`,
        cardPool,
        allowTestCards,
      ),
      corpDeckSnapshotId: deterministicSnapshotId(
        "corp",
        seed,
        `${player}:corp`,
        cardPool,
        allowTestCards,
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
  allowTestCards: boolean,
): DeckSnapshot {
  const snapshot =
    supplied ??
    frozenSnapshots.find(
      (candidate) => candidate.deckSnapshotId === (requestedId || fallbackId),
    );
  if (!snapshot) throw new Error("deck_snapshot_not_found");
  if (snapshot.side !== side) throw new Error("deck_snapshot_wrong_side");
  if (
    !snapshotAllowedForCardPool(
      snapshot,
      cardPool ?? "originalset",
      allowTestCards,
    )
  )
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
  allowTestCards: boolean,
): boolean {
  if (!profileAllowedForCardPool(snapshot.formatProfileId, cardPool))
    return false;
  return [
    snapshot.identityCardId,
    ...snapshot.cards.map((entry) => entry.cardId),
  ].every((cardId) =>
    cardIdAllowedForCardPool(cardId, cardPool, allowTestCards),
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
  allowTestCards: boolean,
): boolean {
  if (cardsById[cardId]?.setId === TEST_CARD_SET_ID && !allowTestCards)
    return false;
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

function testCardAvailability(override: boolean | undefined): boolean {
  return resolveTestCardAvailability(process.env, override);
}

function deterministicSnapshotId(
  side: "runner" | "corp",
  seed: string,
  salt: string,
  cardPool?: MatchCardPool,
  allowTestCards = false,
): string {
  const candidates = frozenSnapshots
    .filter(
      (candidate) =>
        candidate.side === side &&
        candidate.validation.ok &&
        snapshotAllowedForCardPool(
          candidate,
          cardPool ?? "originalset",
          allowTestCards,
        ) &&
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
