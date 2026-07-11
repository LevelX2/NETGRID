import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Phone Freak
// text: Put 3 from the bank on Phone Freak when it is installed. Use these bits only to pay for increasing your link. If you use any of these bits, replace them from the bank at the start of your next turn.
export const classicPhoneFreakImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_054_phone-freak",
  lifecycle: {
    on_install: [addHostedCredits(3)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 3,
    usableFor: ["increase_link"],
  }),
};
