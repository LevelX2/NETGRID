import deckFormatProfiles08Source from "../../../data/decks/deck-format-profiles-0.8.json";

export { default as deckFormatProfiles130Data } from "../../../data/decks/deck-format-profiles-1.3.0.json";

export const deckFormatProfiles08Data = Object.freeze({
  ...deckFormatProfiles08Source,
  profiles: deckFormatProfiles08Source.profiles.filter(
    (profile) => profile.profileId === "local-demo-v0.8",
  ),
});

export const deckSnapshots08Data = Object.freeze({
  schemaVersion: "deck-snapshots-v0.8",
  snapshots: [],
});

export const deckTemplates08Data = Object.freeze({
  schemaVersion: "deck-templates-v0.8",
  templates: [],
});
