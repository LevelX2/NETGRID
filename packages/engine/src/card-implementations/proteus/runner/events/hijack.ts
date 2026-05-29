import type { CardImplementationDefinition } from "../../../types";

// card name: Hijack
// text: Install a program or hardware from your grip. Gain [3] for that installation; return unused bits afterwards.
export const proteusHijackImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_110_hijack",
  runnerEventLongtail: {
    kind: "grip_install_program_or_hardware_with_temporary_credits",
    temporaryCredits: 3,
    allowedTypes: ["program", "hardware"],
    visibility: "hidden_info_barrier",
  },
};
