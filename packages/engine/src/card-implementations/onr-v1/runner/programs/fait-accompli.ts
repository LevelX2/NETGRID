import type { CardImplementationDefinition } from "../../../types";

// card name: Fait Accompli
// text: Whenever you make a successful run on a subsidiary data fort, put a Fait counter in that fort. Every two Fait counters in a fort give +1 difficulty to all agendas installed inside that fort. The Corp may remove all Virus counters by forgoing its next three actions.
export const faitAccompliImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_025_fait-accompli",
  virusCounter: {
    counterKind: "fait",
    addOnSuccessfulRun: {
      server: "subsidiary_data_fort",
      target: "successful_run_server",
      amount: 1,
      visibility: "public",
    },
    continuousEffect: {
      kind: "agenda_difficulty_increase_per_two_fort_counters",
      perCounters: 2,
      amountPerGroup: 1,
      visibility: "public",
    },
  },
};
