import type { CardImplementationDefinition } from "../../../types";

// card name: Bartmoss Memorial Icebreaker
// text: [1]: Break ice subroutine. [1]: +1 strength. After passing each piece of ice, roll a die if you used Bartmoss Memorial Icebreaker to break any subroutines of that ice. On a 1, trash Memorial Icebreaker.
export const bartmossMemorialIcebreakerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_005_bartmoss-memorial-icebreaker",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "any" },
      special: { kind: "bartmoss_post_encounter_self_trash_check" },
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
