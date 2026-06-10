import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Arasaka Portable Prototype
// text: Provides +3 MU. Installing Arasaka Portable Prototype costs 1 agenda point, in addition to the normal cost. Put [3] from the bank on Arasaka Portable Prototype when it is installed. Use these bits only to pay for using icebreakers during runs. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const arasakaPortablePrototypeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_119_arasaka-portable-prototype",
  hardwareDeck: true,
  modifiers: [
    {
      kind: "memory_units",
      operation: "increase",
      amount: 3,
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
    usableFor: ["using_icebreaker_during_run"],
  }),
  installAdditionalCosts: [{ kind: "agenda_point", amount: 1 }],
};
