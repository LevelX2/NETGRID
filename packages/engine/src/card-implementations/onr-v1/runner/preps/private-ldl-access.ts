import type { CardImplementationDefinition } from "../../../types";

// card name: Private LDL Access
// text: Make a run on HQ. If run is successful, do not access cards from HQ; instead, treat run as a successful run on R&D.
export const privateLdlAccessImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_106_private-ldl-access",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "hq" },
          accessServerOverride: "rd",
          visibility: "public",
        },
      ],
    },
  ],
};
