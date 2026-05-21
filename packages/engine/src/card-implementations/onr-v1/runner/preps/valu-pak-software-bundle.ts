import type { CardImplementationDefinition } from "../../../types";

// card name: Valu-Pak Software Bundle
// text: Gain up to five consecutive actions, which you may use only to install programs, and gain [1]. If you do not spend the bit during these actions, return it to the bank afterwards.
export const valuPakSoftwareBundleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_117_valu-pak-software-bundle",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "start_runner_program_install_action_bundle",
          actionCount: 5,
          temporaryCredit: 1,
          allowedActionKind: "install_program",
          mayStopEarly: true,
          visibility: "public",
        },
      ],
    },
  ],
};
