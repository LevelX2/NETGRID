import type { CardImplementationDefinition } from "../../../types";

// card name: Armored Fridge
// text: Put seven Ablative counters on Armored Fridge when it is installed. When the last Ablative counter has been removed, trash Armored Fridge. Ablative counter: Prevent 1 meat damage.
export const armoredFridgeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_121_armored-fridge",
  lifecycle: {
    on_install: [
      {
        kind: "add_counters_to_source",
        counterType: "ablative",
        amount: 7,
        visibility: "public",
      },
    ],
  },
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["meat"],
      amount: 1,
      cost: {
        kind: "source_counter",
        counterType: "ablative",
        amount: 1,
        trashSourceWhenEmpty: true,
      },
      priority: 120,
      visibility: "public",
    },
  ],
};
