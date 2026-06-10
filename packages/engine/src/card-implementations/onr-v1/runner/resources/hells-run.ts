import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Hell's Run
// text: Put [1] from the bank on Hell's Run when it is installed. Use this bit only to pay for increasing your link. If you use the bit, replace it at the start of your next turn.
export const hellsRunImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_164_hells-run",
  lifecycle: {
    on_install: [addHostedCredits(1)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 1,
    usableFor: ["increase_link"],
  }),
};
