import type { CardImplementationDefinition } from "../../../types";

// card name: SeeYa
// text: A, [1]: Expose an installed card.
export const seeyaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_058_seeya",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [
        { kind: "action", amount: 1 },
        { kind: "credit", amount: 1 },
      ],
      label: "SeeYa: installierte Korp-Karte exposen",
      effects: [
        {
          kind: "expose_installed_card",
          target: "chosen_installed_corp_card",
          scope: "any_installed",
          visibility: "public",
        },
      ],
    },
  ],
};
