import type { CardImplementationDefinition } from "../../../types";

// card name: Death Yo-Yo
// text: *Do 1 brain damage. *End the run. If Runner passes Death Yo-Yo, you may choose to uninstall it, store it in HQ, and gain [1].
export const proteusDeathYoYoImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_019_death-yo-yo",
  printedSubroutines: [
    { kind: "damage", damageType: "brain", amount: 1, preventable: true, text: "*Do 1 brain damage." },
    { kind: "end_the_run", text: "*End the run." },
  ],
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
