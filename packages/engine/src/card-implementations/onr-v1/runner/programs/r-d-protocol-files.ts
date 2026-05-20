import type { CardImplementationDefinition } from "../../../types";

// card name: R&D-Protocol Files
// text: A: Make a run on R&D, but instead of accessing cards, look at the top five cards of R&D.
export const rAndDProtocolFilesImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_050_r-and-d-protocol-files",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "R&D-Protocol Files: Run auf R&D",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "rd" },
          successfulRunAccessReplacement: "private_look_top_rd",
          successfulRunPrivateLookCount: 5,
          visibility: "public",
        },
      ],
    },
  ],
};
