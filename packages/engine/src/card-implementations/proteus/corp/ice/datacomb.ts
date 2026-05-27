import type { CardImplementationDefinition } from "../../../types";

// card name: Datacomb
// text: *End the run. If Runner passes Datacomb, pay [1], or uninstall it and store it in HQ.
export const proteusDatacombImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_018_datacomb",
  printedSubroutines: [{ kind: "end_the_run", text: "*End the run." }],
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
