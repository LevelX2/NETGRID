import type { CardImplementationDefinition } from "../../../types";

// card name: Zetatech Software Installer
// text: Put [2] on Software Installer when it is installed. Use these bits only to pay for installing programs. You may use these bits to install a program overwriting Software Installer itself. If you use any of these bits, replace them at the start of your next turn.
export const zetatechSoftwareInstallerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_075_zetatech-software-installer",
  lifecycle: {
    on_install: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 2,
        visibility: "public",
      },
    ],
  },
  restrictedHostedCreditSource: {
    capacity: 2,
    counterType: "bit",
    usableFor: ["install_programs"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
    allowUseWhileOverwritingSource: true,
  },
};
