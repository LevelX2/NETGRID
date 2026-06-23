import type { CardImplementationDefinition } from "../../../types";

// card name: Silver Lining Recovery Protocol
// text: If any agendas were stolen during Runner's last turn, gain bits equal to three times the number of advancement counters those agendas had.
export const silverLiningRecoveryProtocolImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_303_silver-lining-recovery-protocol",
  corpUtility: {
    kind: "gain_credits_from_stolen_agenda_advancement_history",
    multiplierPerAdvancementCounter: 3,
    visibility: "public",
  },
};
