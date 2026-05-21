import type { CardImplementationDefinition } from "../../../types";

// card name: "Armadillo" Armored Road Home
// text: Put [2] from the bank on Armored Road Home when it is installed. Use these bits only to pay for removing tags. If you use any of these bits, replace them at the start of your next turn. [T]: Prevent up to 3 meat damage.
export const armadilloArmoredRoadHomeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_120_armadillo-armored-road-home",
  lifecycle: {
    on_install: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 2,
        visibility: "public",
      },
    ],
  },
  restrictedHostedCreditSource: {
    capacity: 2,
    counterType: "bit",
    usableFor: ["remove_tags"],
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
  },
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["meat"],
      amount: 3,
      cost: { kind: "trash_source" },
      priority: 118,
      visibility: "public",
    },
  ],
};
