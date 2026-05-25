import type { CardImplementationDefinition } from "../../../types";

// card name: Mobile Barricade
// text: *Do 1 Net damage. *End the run. [1]: Move Mobile Barricade and insert it in a different position on this data fort. Use this ability only at the start of a run on this data fort. You may use this ability even if Mobile Barricade is unrezzed, in which case, you reveal it.
export const proteusMobileBarricadeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_033_mobile-barricade",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "net",
      amount: 1,
      preventable: true,
      text: "*Do 1 Net damage.",
    },
    { kind: "end_the_run", text: "*End the run." },
  ],
  fortRunWindows: [
    {
      kind: "move_self_to_different_position_on_same_fort",
      timing: "start_of_run_on_this_fort",
      cost: { kind: "credit", amount: 1 },
      target: "different_position_on_same_fort",
      revealIfUnrezzed: true,
      limit: "once_per_run_per_source",
      visibility: "public",
    },
  ],
};
