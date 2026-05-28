import type { CardImplementationDefinition } from "../../../types";

export const worldDominationImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_010_world-domination",
  scoredAgenda: {
    kind: "fixed_bonus_agenda_points_on_score",
    amount: 4,
    visibility: "public",
  },
};
