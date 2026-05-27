import type { CardImplementationDefinition } from "../../../types";

// card name: Eurocorpse (TM) Spin Chip
// text: Install an icebreaker in Eurocorpse (TM) Spin Chip. Put [2] from the bank on Eurocorpse when it is installed. Use these bits only to pay for using the hosted icebreaker during runs. Replace used bits at the start of your next turn.
export const proteusEurocorpseTmSpinChipImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_139_eurocorpse-tm-spin-chip",
    hostedProgramCapacity: {
      capacityMu: 99,
      allowedCardTypes: ["program"],
      allowedProgramSubtypes: ["icebreaker"],
      maxHostedPrograms: 1,
      hostedProgramsAreInstalled: true,
      hostLeavesPlayTrashesHosted: true,
    },
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
      usableFor: ["using_icebreaker_during_run"],
      requireHostedBreakerForIcebreakerUse: true,
      refresh: {
        timing: "start_of_runner_turn",
        mode: "refill_to_capacity_if_used",
      },
    },
  };
