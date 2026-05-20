import type { CardImplementationDefinition } from "../../../types";

// card name: Shredder Uplink Protocol
// text: A: Make a run on the Archives. If run is successful, do not access cards from the Archives; instead, treat run as a successful run on HQ.
export const shredderUplinkProtocolImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_062_shredder-uplink-protocol",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "Shredder Uplink Protocol: Run auf Archive",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "archives" },
          accessServerOverride: "hq",
          visibility: "public",
        },
      ],
    },
  ],
};
