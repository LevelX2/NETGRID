import {
  deckFormatProfiles08Data as profilesData,
  deckFormatProfiles130Data as profilesData130,
} from "@netgrid/runtime-data/deck-format-profiles";
import {
  deckSnapshots08Data as snapshotsData,
  deckTemplates08Data as templatesData,
} from "@netgrid/runtime-data/legacy-demo-decks";
import {
  assertDeckPayloadSafe,
  createDeckSnapshot,
  validateDeckSnapshot,
  validateEditableDeck,
  type DeckFormatProfile,
  type DeckSnapshot,
  type DeckTemplate,
  type DeckValidationContext,
  type EditableDeck,
} from "@netgrid/decks";
import {
  TEST_CARD_SET_ID,
  testCardsEnabledFromEnvironment,
  type ApiMatchCardPool,
} from "@netgrid/shared";
import { createRuntimeCardsById } from "../card-pool-runtime";

const profiles = [
  ...(profilesData.profiles as DeckFormatProfile[]),
  ...(profilesData130.profiles as DeckFormatProfile[]),
];
const profile =
  profiles.find((candidate) => candidate.profileId === "local-demo-v0.8") ??
  profiles[0]!;
const privateLocalProfile = profiles.find(
  (candidate) => candidate.profileId === "netgrid_private_local_v1",
);
const classicPlaytestProfile = profiles.find(
  (candidate) =>
    candidate.profileId === "netgrid_private_local_classic_playtest_v1",
);
const proteusPlaytestProfile = profiles.find(
  (candidate) =>
    candidate.profileId === "netgrid_private_local_proteus_playtest_v1",
);
const classicProteusPlaytestProfile = profiles.find(
  (candidate) =>
    candidate.profileId === "netgrid_private_local_classic_proteus_playtest_v1",
);
const templates = templatesData.templates as DeckTemplate[];
const snapshots = snapshotsData.snapshots as DeckSnapshot[];

export function deckTemplatesResponse() {
  return safeDeckPayload({
    schemaVersion: templatesData.schemaVersion,
    cardPoolSnapshotId: templatesData.cardPoolSnapshotId,
    formatProfileId: templatesData.formatProfileId,
    templates: templates.filter((template) => deckCardsAvailable(template)),
  });
}

export function deckSnapshotsResponse() {
  return safeDeckPayload({
    schemaVersion: snapshotsData.schemaVersion,
    cardPoolSnapshotId: snapshotsData.cardPoolSnapshotId,
    formatProfileId: snapshotsData.formatProfileId,
    snapshots: snapshots
      .filter((snapshot) => deckCardsAvailable(snapshot))
      .map((snapshot) => ({
        ...snapshot,
        validation: validateDeckSnapshot(
          snapshot,
          contextForSnapshot(snapshot),
        ),
      })),
  });
}

export function deckValidationResponse(
  deck: EditableDeck,
  options: { matchCardPool?: ApiMatchCardPool } = {},
) {
  const deckForValidation = deckForMatchCardPool(deck, options.matchCardPool);
  const selectedProfile = profiles.find(
    (candidate) => candidate.profileId === deckForValidation.formatProfileId,
  );
  if (!selectedProfile) {
    return safeDeckPayload({
      validation: {
        ok: false,
        errors: ["Deck format profile is not supported."],
        errorCodes: ["format_profile_unsupported"],
        warnings: [],
        totalCards:
          deckForValidation.cards?.reduce(
            (sum, entry) =>
              sum + (Number.isFinite(entry.quantity) ? entry.quantity : 0),
            0,
          ) ?? 0,
        agendaPoints: null,
      },
      snapshot: null,
    });
  }
  const context = contextForProfile(selectedProfile);
  const validation = validateEditableDeck(deckForValidation, context);
  return safeDeckPayload({
    validation,
    snapshot: validation.ok
      ? createDeckSnapshot(deckForValidation, context, {
          rulesBaselineId: rulesBaselineForDeck(deckForValidation),
        })
      : null,
  });
}

function deckForMatchCardPool(
  deck: EditableDeck,
  matchCardPool: ApiMatchCardPool | undefined,
): EditableDeck {
  if (!matchCardPool) return deck;
  const selectedProfile = profileForMatchCardPool(matchCardPool);
  if (!selectedProfile) return deck;
  return {
    ...deck,
    cardPoolSnapshotId: selectedProfile.cardPoolSnapshotId,
    ...(selectedProfile.cardPoolVersion
      ? { cardPoolVersion: selectedProfile.cardPoolVersion }
      : {}),
    formatProfileId: selectedProfile.profileId,
    ...(selectedProfile.version
      ? { formatProfileVersion: selectedProfile.version }
      : {}),
  };
}

function profileForMatchCardPool(
  matchCardPool: ApiMatchCardPool,
): DeckFormatProfile | undefined {
  if (matchCardPool === "originalset_classic") return classicPlaytestProfile;
  if (matchCardPool === "originalset_proteus") return proteusPlaytestProfile;
  if (matchCardPool === "originalset_classic_proteus")
    return classicProteusPlaytestProfile;
  return privateLocalProfile;
}

function safeDeckPayload(payload: unknown) {
  const safety = assertDeckPayloadSafe(payload);
  if (!safety.ok)
    return {
      status: 500,
      body: {
        error: {
          code: "deck_payload_unsafe",
          message: "Deckantwort wurde aus Sicherheitsgründen blockiert.",
        },
      },
    };
  return { status: 200, body: payload };
}

function contextForSnapshot(snapshot: DeckSnapshot) {
  const snapshotProfile =
    profiles.find(
      (candidate) => candidate.profileId === snapshot.formatProfileId,
    ) ?? profile;
  return contextForProfile(snapshotProfile);
}

function contextForProfile(
  deckProfile: DeckFormatProfile,
): DeckValidationContext {
  return { cardsById: availableCardsById(), profile: deckProfile };
}

function availableCardsById(): DeckValidationContext["cardsById"] {
  const cardsById = createRuntimeCardsById();
  if (testCardsEnabledFromEnvironment(process.env)) return cardsById;
  return Object.fromEntries(
    Object.entries(cardsById).filter(
      ([, card]) => card.setId !== TEST_CARD_SET_ID,
    ),
  );
}

function deckCardsAvailable(deck: {
  identityCardId?: string;
  identity?: string;
  cards: Array<{ cardId?: string; id?: string }>;
}): boolean {
  if (testCardsEnabledFromEnvironment(process.env)) return true;
  const cardsById = createRuntimeCardsById();
  const ids = [
    deck.identityCardId ?? deck.identity,
    ...deck.cards.map((entry) => entry.cardId ?? entry.id),
  ].filter((id): id is string => typeof id === "string");
  return ids.every((id) => cardsById[id]?.setId !== TEST_CARD_SET_ID);
}

function rulesBaselineForDeck(deck: EditableDeck): string {
  if (
    deck.cards.some(
      (entry) =>
        entry.cardId.startsWith("onr_v1_") || entry.cardId.startsWith("v094_"),
    )
  )
    return "rules-baseline-mvp-0.94";
  if (
    deck.cards.some((entry) => entry.cardId.startsWith("v08_")) ||
    deck.cardPoolSnapshotId === "card-snapshot-0.8"
  )
    return "rules-baseline-mvp-0.8";
  if (deck.deckVersion.startsWith("0.1")) return "rules-baseline-mvp-0.1";
  return "rules-baseline-mvp-0.4";
}
