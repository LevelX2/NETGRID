import type { CardImplementationDefinition } from "../../../types";

// card name: Viral 15
// text: *For the remainder of the run, Runner must pay [1] to jack out, in addition to any other costs. *For the remainder of the run, Runner trashes an installed program after passing each piece of rezzed ice, including Viral 15, unless Runner jacks out.
export const viral15Implementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_276_viral-15",
  printedSubroutines: [
    {
      kind: "run_duration_jack_out_cost",
      amount: 1,
      text: "*For the remainder of the run, Runner must pay [1] to jack out, in addition to any other costs.",
    },
    {
      kind: "run_duration_trash_program_after_passing_rezzed_ice_unless_jack_out",
      text: "*For the remainder of the run, Runner trashes an installed program after passing each piece of rezzed ice, including Viral 15, unless Runner jacks out.",
    },
  ],
};
