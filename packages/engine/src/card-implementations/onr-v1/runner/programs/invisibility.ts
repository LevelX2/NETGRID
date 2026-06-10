import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Invisibility
// text: Put [1] from the bank on Invisibility when it is installed. Use this bit only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use the bit, replace it at the start of your next turn.
export const invisibilityImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_035_invisibility",
  lifecycle: {
    on_install: [addHostedCredits(1)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 1,
    usableFor: ["using_icebreaker_during_run_non_noisy"],
  }),
};
