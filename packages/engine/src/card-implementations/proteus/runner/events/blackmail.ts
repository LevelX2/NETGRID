import type { CardImplementationDefinition } from "../../../types";

export const blackmailImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_102_blackmail",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "hq" },
          successfulRunAccessReplacement: "runner_gain_agenda_point",
          visibility: "public",
        },
      ],
    },
  ],
};
