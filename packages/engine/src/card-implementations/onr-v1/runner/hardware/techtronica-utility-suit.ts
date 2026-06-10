import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Techtronica Utility Suit
// text: Provides +1 MU. Prevents 1 meat damage each turn. Put [5] on Techtronica Utility Suit when it is installed. Use these bits only to pay for increasing your link. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.
export const techtronicaUtilitySuitImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_143_techtronica-utility-suit",
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
    on_install: [addHostedCredits(5)],
  },
  restrictedHostedCreditSource: restrictedHostedCreditSource({
    capacity: 5,
    usableFor: ["increase_link"],
  }),
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["meat"],
      amount: 1,
      limit: { kind: "per_turn", amount: 1 },
      cost: { kind: "none" },
      priority: 124,
      visibility: "public",
    },
  ],
};
