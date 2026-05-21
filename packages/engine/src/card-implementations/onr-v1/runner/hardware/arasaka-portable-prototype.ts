import type { CardImplementationDefinition } from "../../../types";

// card name: Arasaka Portable Prototype
// text: Provides +3 MU. Installing Arasaka Portable Prototype costs 1 agenda point, in addition to the normal cost. Put [3] from the bank on Arasaka Portable Prototype when it is installed. Use these bits only to pay for using icebreakers during runs. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const arasakaPortablePrototypeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_119_arasaka-portable-prototype",
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
    on_install: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 3,
        visibility: "public",
      },
    ],
  },
  restrictedHostedCreditSource: {
    capacity: 3,
    counterType: "bit",
    usableFor: ["using_icebreaker_during_run"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
  installAdditionalCosts: [{ kind: "agenda_point", amount: 1 }],
};
