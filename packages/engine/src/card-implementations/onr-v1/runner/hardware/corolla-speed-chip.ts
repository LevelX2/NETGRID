import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Corolla Speed Chip
// text: Put [1] from the bank on Corolla Speed Chip when it is installed. Use this bit only to pay for using killers during runs. If you use the bit, replace it at the start of your next turn.
export const corollaSpeedChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_124_corolla-speed-chip",
  lifecycle: {
    on_install: [addHostedCredits(1)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 1,
    usableFor: ["using_killer_during_run"],
  }),
};
