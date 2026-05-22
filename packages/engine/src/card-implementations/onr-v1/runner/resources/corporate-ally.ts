import type { CardImplementationDefinition } from "../../../types";

// card name: Corporate Ally
// text: Installing Corporate Ally costs 1 agenda point, in addition to the normal cost. The difficulty of all agendas is +1. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.
export const corporateAllyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_156_corporate-ally",
  unique: {
    kind: "unique_by_title",
    controller: "runner",
  },
  installAdditionalCosts: [{ kind: "agenda_point", amount: 1 }],
  modifiers: [
    {
      kind: "agenda_difficulty",
      operation: "increase",
      amount: 1,
      activeWhile: "installed",
      sourceZone: "runner_installed",
      side: "corp",
      visibility: "public",
      appliesTo: {
        cardType: "agenda",
      },
    },
  ],
};
