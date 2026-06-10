import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Scatter Shot
// text: Put [2] from the bank on Scatter Shot when it is installed. Use these bits only to pay for trashing upgrades. If you use any of these bits, replace them at the start of your next turn.
export const scatterShotImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_057_scatter-shot",
  lifecycle: {
    on_install: [addHostedCredits(2)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 2,
    usableFor: ["trash_upgrades"],
  }),
};
