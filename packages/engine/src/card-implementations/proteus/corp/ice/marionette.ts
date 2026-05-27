import type { CardImplementationDefinition } from "../../../types";

// card name: Marionette
// text: *Trash a program. *End the run. If Runner passes Marionette, pay [1], or uninstall it and store it in HQ.
export const proteusMarionetteImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_029_marionette",
  printedSubroutines: [
    { kind: "trash_program", text: "*Trash a program." },
    { kind: "end_the_run", text: "*End the run." },
  ],
  fortRunWindows: [
    {
      kind: "corp_return_passed_ice_to_hq",
      timing: "after_runner_passes_this_ice",
      mode: "required_pay_or_return",
      paymentAmount: 1,
      visibility: "public",
    },
  ],
};
