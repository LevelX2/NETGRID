import type { CardImplementationDefinition } from "../../../types";

// card name: Panic Button
// text: Install Panic Button only in HQ. [1]: Draw a card. Use this ability only during a run on HQ.
export const proteusPanicButtonImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_067_panic-button",
  installCapabilities: [
    {
      kind: "install_only_in_hq",
      visibility: "public",
    },
  ],
  abilities: [
    {
      kind: "activated",
      timing: "corp_during_run",
      costs: [{ kind: "credit", amount: 1 }],
      condition: { kind: "current_run_server", server: "hq" },
      effects: [
        {
          kind: "draw_cards",
          recipient: "corp",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
