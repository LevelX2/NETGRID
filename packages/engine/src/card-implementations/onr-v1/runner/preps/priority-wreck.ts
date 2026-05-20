import type { CardImplementationDefinition } from "../../../types";

// card name: Priority Wreck
// text: Make a run on HQ. If run is successful, do not access cards from HQ; instead, pay any number of bits to force the Corp to lose that many bits.
export const priorityWreckImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_105_priority-wreck",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "hq" },
          successfulRunAccessReplacement: "runner_spend_corp_lose_credits",
          visibility: "public",
        },
      ],
    },
  ],
};
