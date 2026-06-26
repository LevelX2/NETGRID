import type { DeckFormatProfile } from "@netgrid/decks";
import deckFormatProfiles130Data from "../../../../data/decks/deck-format-profiles-1.3.0.json";

export const BENCHMARK_DECK_FORMAT_PROFILE: DeckFormatProfile =
  (deckFormatProfiles130Data.profiles as DeckFormatProfile[]).find(
    (profile) => profile.profileId === "netgrid_private_local_v1",
  ) ?? missingBenchmarkDeckFormatProfile();

function missingBenchmarkDeckFormatProfile(): never {
  throw new Error(
    "Missing netgrid_private_local_v1 deck format profile for AI benchmark local deck adapter.",
  );
}
