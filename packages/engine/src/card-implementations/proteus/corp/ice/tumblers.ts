import type { CardImplementationDefinition } from "../../../types";

// card name: Tumblers
// text: *End the run. If Runner passes Tumblers, you may choose to uninstall it, store it in HQ, and gain [1].
export const proteusTumblersImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_042_tumblers",
  printedSubroutines: [{ kind: "end_the_run", text: "*End the run." }],
  fortRunWindows: [
    {
      kind: "corp_return_passed_ice_to_hq",
      timing: "after_runner_passes_this_ice",
      mode: "optional_return_gain",
      gainCredits: 1,
      visibility: "public",
    },
  ],
};
