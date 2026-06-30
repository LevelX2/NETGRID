import type { CardImplementationDefinition } from "../../../types";

// card name: Sandbox Dig
// text: [3], [T]: Look at the top three cards stored in R&D. Hidden resources are installed face down, but are put into the trash face up.
export const classicSandboxDigImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_050_sandbox-dig",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [
        { kind: "credit", amount: 3 },
        { kind: "tap_source", amount: 1 },
      ],
      label: "Sandbox Dig: R&D-Spitze ansehen",
      effects: [
        {
          kind: "private_look",
          zone: "rd",
          count: 3,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
