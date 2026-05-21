import type { CardImplementationDefinition } from "../../../types";

// card name: Silver Lining Recovery Protocol
// text: If any agendas were stolen during Runner's last turn, gain bits equal to three times the number of advancement counters those agendas had.
export const silverLiningRecoveryProtocolImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_303_silver-lining-recovery-protocol",
  corpUtility: {
    kind: "silver_lining_recovery",
    multiplierPerAdvancementCounter: 3,
    visibility: "public",
  },
};
