import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: "Drifter" Mobile Environment
// text: Put [2] from the bank on Mobile Environment when it is installed. Use these bits only to pay for removing tags. If you use any of these bits, replace them at the start of your next turn.
export const drifterMobileEnvironmentImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_126_drifter-mobile-environment",
  lifecycle: {
    on_install: [addHostedCredits(2)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 2,
    usableFor: ["remove_tags"],
  }),
};
