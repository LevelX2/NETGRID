import type { CardImplementationDefinition } from "../../../types";

// card name: Senatorial Field Trip
// text: Play only if the Corp rezzed a piece of Black Ice this turn. The Corp either derezzes that piece of ice or receives 2 Bad Publicity points.
export const proteusSenatorialFieldTripImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_123_senatorial-field-trip",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: { kind: "corp_rezzed_black_ice_this_turn" },
      effects: [
        {
          kind: "corp_choice_derez_last_rezzed_black_ice_or_bad_publicity",
          badPublicity: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
