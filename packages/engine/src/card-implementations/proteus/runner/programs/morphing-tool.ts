import type { CardImplementationDefinition } from "../../../types";

// card name: Morphing Tool
// text: Choose Code Gates, Sentries, or Walls when you install Morphing Tool. [2]: Break a subroutine of the chosen type. [1]: +1 strength. [1], A: Choose a new type.
export const proteusMorphingToolImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_092_morphing-tool",
  installTargetBinding: {
    kind: "choose_icebreaker_subtype_on_install",
    stores: "selectedSubtype",
    choices: ["code_gate", "sentry", "wall"],
    visibility: "public",
  },
  icebreakerSubtypeChange: {
    timing: "runner_main",
    cost: { clicks: 1, credits: 1 },
    choices: ["code_gate", "sentry", "wall"],
    visibility: "public",
  },
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 2 },
      matches: { kind: "selected_ice_subtype" },
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 1 },
      amount: 1,
      duration: "current_encounter",
      visibility: "public",
    },
  ],
};
