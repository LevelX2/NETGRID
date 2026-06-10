import type { CardImplementationDefinition } from "../../../types";

// card name: Microtech Backup Drive
// text: Whenever one or more installed programs are being sent to the trash at the same time, you may instead choose to put any or all of the programs on top of Microtech Backup Drive in any order you choose. If Backup Drive is removed from play, trash any cards on it. A: Bring the top card on Backup Drive into your hand.
export const microtechBackupDriveImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_131_microtech-backup-drive",
  runnerUtilityLongtail: {
    kind: "replace_installed_program_trash_with_host_on_source",
    visibility: "hidden_info_barrier",
  },
};
