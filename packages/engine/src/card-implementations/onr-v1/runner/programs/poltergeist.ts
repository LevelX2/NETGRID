import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Poltergeist
// text: Put [2] on Poltergeist when it is installed. Use these bits only to pay for trashing nodes. If you use any of these bits, replace them at the start of your next turn.
export const poltergeistImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_048_poltergeist",
  lifecycle: {
    on_install: [addHostedCredits(2)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 2,
    usableFor: ["trash_nodes"],
  }),
};
