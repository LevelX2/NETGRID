import profilesData from "../../../../../data/decks/deck-format-profiles-0.8.json";
import profilesData130 from "../../../../../data/decks/deck-format-profiles-1.3.0.json";
import snapshotsData from "../../../../../data/decks/deck-snapshots-0.8.json";
import templatesData from "../../../../../data/decks/deck-templates-0.8.json";
import {
  assertDeckPayloadSafe,
  createDeckSnapshot,
  validateDeckSnapshot,
  validateEditableDeck,
  type DeckFormatProfile,
  type DeckSnapshot,
  type DeckTemplate,
  type DeckValidationContext,
  type EditableDeck
} from "@netgrid/decks";
import { createRuntimeCardsById } from "../card-pool-runtime";

const profiles = [...(profilesData.profiles as DeckFormatProfile[]), ...(profilesData130.profiles as DeckFormatProfile[])];
const profile = profiles.find((candidate) => candidate.profileId === "local-demo-v0.8") ?? profiles[0]!;
const templates = templatesData.templates as DeckTemplate[];
const snapshots = snapshotsData.snapshots as DeckSnapshot[];

export function deckTemplatesResponse() {
  return safeDeckPayload({
    schemaVersion: templatesData.schemaVersion,
    cardPoolSnapshotId: templatesData.cardPoolSnapshotId,
    formatProfileId: templatesData.formatProfileId,
    templates
  });
}

export function deckSnapshotsResponse() {
  return safeDeckPayload({
    schemaVersion: snapshotsData.schemaVersion,
    cardPoolSnapshotId: snapshotsData.cardPoolSnapshotId,
    formatProfileId: snapshotsData.formatProfileId,
    snapshots: snapshots.map((snapshot) => ({
      ...snapshot,
      validation: validateDeckSnapshot(snapshot, contextForSnapshot(snapshot))
    }))
  });
}

export function deckValidationResponse(deck: EditableDeck) {
  const selectedProfile = profiles.find((candidate) => candidate.profileId === deck.formatProfileId);
  if (!selectedProfile) {
    return safeDeckPayload({
      validation: {
        ok: false,
        errors: ["Deck format profile is not supported."],
        errorCodes: ["format_profile_unsupported"],
        warnings: [],
        totalCards: deck.cards?.reduce((sum, entry) => sum + (Number.isFinite(entry.quantity) ? entry.quantity : 0), 0) ?? 0,
        agendaPoints: null
      },
      snapshot: null
    });
  }
  const context = contextForProfile(selectedProfile);
  const validation = validateEditableDeck(deck, context);
  return safeDeckPayload({
    validation,
    snapshot: validation.ok ? createDeckSnapshot(deck, context, { rulesBaselineId: rulesBaselineForDeck(deck) }) : null
  });
}

function safeDeckPayload(payload: unknown) {
  const safety = assertDeckPayloadSafe(payload);
  if (!safety.ok) return { status: 500, body: { error: { code: "deck_payload_unsafe", message: "Deckantwort wurde aus Sicherheitsgründen blockiert." } } };
  return { status: 200, body: payload };
}

function contextForSnapshot(snapshot: DeckSnapshot) {
  const snapshotProfile = profiles.find((candidate) => candidate.profileId === snapshot.formatProfileId) ?? profile;
  return contextForProfile(snapshotProfile);
}

function contextForProfile(deckProfile: DeckFormatProfile): DeckValidationContext {
  return { cardsById: createRuntimeCardsById(), profile: deckProfile };
}

function rulesBaselineForDeck(deck: EditableDeck): string {
  if (deck.cards.some((entry) => entry.cardId.startsWith("onr_v1_") || entry.cardId.startsWith("v094_"))) return "rules-baseline-mvp-0.94";
  if (deck.cards.some((entry) => entry.cardId.startsWith("v08_")) || deck.cardPoolSnapshotId === "card-snapshot-0.8") return "rules-baseline-mvp-0.8";
  if (deck.deckVersion.startsWith("0.1")) return "rules-baseline-mvp-0.1";
  return "rules-baseline-mvp-0.4";
}
