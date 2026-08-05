import type { CardImplementationDefinition } from "../../../types";

// card name: Dogcatcher
// text: [1]: Break pit bull, hellhound, bloodhound, or watchdog subroutine. [1]: +1 strength.
export const dogcatcherImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_018_dogcatcher",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: {
        kind: "ice_definition_any_of",
        definitionIds: [
          "onr_classic_005_baskerville",
          "onr_proteus_014_chihuahua",
          "onr_proteus_016_coyote",
          "onr_proteus_026_hunting-pack",
          "onr_v1_225_canis-major",
          "onr_v1_226_canis-minor",
          "onr_v1_227_cerberus",
          "onr_v1_240_fang",
          "onr_v1_241_fang-2-0",
          "onr_v1_243_fetch-4-0-1",
          "onr_v1_249_hunter",
          "onr_v1_255_mastiff",
          "onr_v1_264_rex",
        ],
      },
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 1 },
      amount: 1,
      duration: "current_encounter",
      visibility: "public",
    },
  ],
};
