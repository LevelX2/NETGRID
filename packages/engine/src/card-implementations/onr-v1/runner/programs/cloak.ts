import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Cloak
// text: Put [3] from the bank on Cloak when it is installed. Use these bits only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use any of these bits, replace them at the start of your next turn.
export const cloakImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_011_cloak",
  lifecycle: {
    on_install: [addHostedCredits(3)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 3,
    usableFor: ["using_icebreaker_during_run_non_noisy"],
  }),
};
