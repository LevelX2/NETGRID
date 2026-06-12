import type { CardImplementationDefinition } from "../../../types";

// card name: Quest for Cattekin
// text: At the start of each of your turns, roll a die. On a 6, trash Quest for Cattekin, and you gain an action on each of your turns for the remainder of the game. On a 1, suffer 1 brain damage. On a 2, suffer 1 Net damage. Damage from Quest for Cattekin cannot be prevented.
export const questForCattekinImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_172_quest-for-cattekin",
  runnerUtilityLongtail: {
    kind: "start_turn_random_effect_table",
    dieFaces: 6,
    randomPurpose: "runner_start_turn_source",
    outcomes: [
      {
        roll: 6,
        kind: "trash_source_and_grant_persistent_extra_action",
        extraActions: 1,
      },
      { roll: 1, kind: "unpreventable_damage", damageType: "core", amount: 1 },
      { roll: 2, kind: "unpreventable_damage", damageType: "net", amount: 1 },
    ],
    defaultOutcome: { kind: "no_effect" },
    visibility: "public",
  },
};
