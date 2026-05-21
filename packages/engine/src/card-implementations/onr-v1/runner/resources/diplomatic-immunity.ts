import type { CardImplementationDefinition } from "../../../types";

// card name: Diplomatic Immunity
// text: Prevents all meat damage. The Corp may pay 1 agenda point to cancel this effect until end of turn. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.
export const diplomaticImmunityImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_160_diplomatic-immunity",
  unique: {
    kind: "unique_by_title",
    controller: "runner",
  },
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["meat"],
      amount: "all",
      cost: { kind: "none" },
      corpMayCancelUntilEndOfTurn: { agendaPointCost: 1 },
      priority: 140,
      visibility: "public",
    },
  ],
};
