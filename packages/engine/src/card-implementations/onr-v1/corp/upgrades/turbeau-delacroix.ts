import type { CardImplementationDefinition } from "../../../types";

// card name: Turbeau Delacroix
// text: Trace 10-If trace is successful, give Runner a tag. Use this ability only when Runner accesses Turbeau Delacroix, and only once during each run on this fort.
export const oncePerRunAccessTraceUpgradeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_372_turbeau-delacroix",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed"],
      effects: [
        {
          kind: "trace",
          baseTraceStrength: 10,
          onSuccess: [
            {
              kind: "add_tags",
              recipient: "runner",
              amount: 1,
              visibility: "public",
            },
          ],
          limit: "once_per_run_on_this_fort_per_source",
          visibility: "hidden_info_barrier",
        },
      ],
      visibility: "hidden_info_barrier",
    },
  ],
};
