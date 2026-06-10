import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: ZZ22 Speed Chip
// text: Put [2] from the bank on ZZ22 Speed Chip when it is installed. Use these bits only to pay for using killers during runs. If you use any of these bits, replace them at the start of your next turn.
export const zz22SpeedChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_147_zz22-speed-chip",
  lifecycle: {
    on_install: [addHostedCredits(2)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 2,
    usableFor: ["using_killer_during_run"],
  }),
};
