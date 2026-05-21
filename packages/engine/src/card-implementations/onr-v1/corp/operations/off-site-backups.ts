import type { CardImplementationDefinition } from "../../../types";

// card name: Off-Site Backups
// text: Bring any card from the Archives into HQ.
export const offSiteBackupsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_296_off-site-backups",
  corpUtility: {
    kind: "corp_archives_to_hq",
    visibility: "hidden_info_barrier",
  },
};
