import type { CardImplementationDefinition } from "../../../types";

// card name: Siren
// text: Rez Siren when you install it. Install Siren only if you can pay to rez it. [1]: Runner must make a run on the fort Siren is installed in, if possible, instead of on the fort he or she was originally going to make a run on. Use this ability only at the start of a run.
export const proteusSirenImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_074_siren",
  installCapabilities: [
    {
      kind: "rez_on_install",
      installOnlyIfRezAffordable: true,
      visibility: "public",
    },
  ],
  corpUtility: {
    kind: "siren_start_run_redirect",
    cost: { kind: "credit", amount: 1 },
    timing: "start_of_run",
    target: "source_fort",
    visibility: "public",
  },
};
