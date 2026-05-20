import type { CardImplementationDefinition } from "../../../types";

// card name: Pacifica Regional AI
// text: You may advance Pacifica Regional AI before and after you rez it. Regional AI Advancement counter: Gain an action.
export const pacificaRegionalAiImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_334_pacifica-regional-ai",
  advanceable: { while: "installed_before_and_after_rez" },
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "advancement_counter", amount: 1, source: "source" }],
      condition: { kind: "source_has_advancement_counters", minimum: 1 },
      label: "Pacifica Regional AI: Advancement-Counter fuer Aktion ausgeben",
      effects: [
        {
          kind: "gain_actions",
          recipient: "controller",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
