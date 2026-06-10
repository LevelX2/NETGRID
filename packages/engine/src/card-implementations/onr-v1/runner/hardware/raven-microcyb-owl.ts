import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Raven Microcyb Owl
// text: Provides +1 MU. Put [3] from the bank on Microcyb Owl when it is installed. Use these bits only to pay for using icebreakers during runs, but not for using noisy icebreakers. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const ravenMicrocybOwlImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_141_raven-microcyb-owl",
  hardwareDeck: true,
  modifiers: [
    {
      kind: "memory_units",
      operation: "increase",
      amount: 1,
      activeWhile: "installed",
      sourceZone: "runner_installed",
      side: "runner",
      visibility: "public",
    },
  ],
  lifecycle: {
    on_install: [addHostedCredits(3)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 3,
    usableFor: ["using_icebreaker_during_run_non_noisy"],
  }),
};
