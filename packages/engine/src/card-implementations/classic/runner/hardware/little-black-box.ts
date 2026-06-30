import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Little Black Box
// text: Provides +1 MU and +1 hand size. Prevent up to 1 Net or brain damage each turn. Put [1] from the bank on Little Black Box when it is installed. Use this bit only to pay for increasing your link. If you use the bit, replace it from the bank at the start of your next turn. Only one deck...
export const classicLittleBlackBoxImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_047_little-black-box",
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
      {
        kind: "hand_size",
        operation: "increase",
        amount: 1,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        side: "runner",
        visibility: "public",
      },
    ],
    lifecycle: {
      on_install: [addHostedCredits(1)],
    },
    restrictedHostedCreditSource: restrictedHostedCreditSource({
      capacity: 1,
      usableFor: ["increase_link"],
    }),
    damagePreventionSources: [
      {
        kind: "damage_prevention",
        damageTypes: ["net", "core"],
        amount: 1,
        limit: { kind: "per_turn", amount: 1 },
        cost: { kind: "none" },
        priority: 122,
        visibility: "public",
      },
    ],
  };
