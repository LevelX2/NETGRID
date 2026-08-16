import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_proteus_139_eurocorpse-tm-spin-chip",
    ),
    title: "Eurocorpse (TM) Spin Chip",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put [2] from the bank on Spin Chip when it is installed. Spin Chip can have an icebreaker installed in it whose MU cost is no greater than 1. Use the bits on Spin Chip only to pay for using this icebreaker during runs. If you use any of these bits, replace them from the bank at the start of your next turn.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_139_eurocorpse-tm-spin-chip",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["chip"],
      numeric: {
        installCost: 6,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    hostedProgramCapacity: {
      capacityMu: 1,
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
      refresh: {
        timing: "start_of_runner_turn",
        mode: "refill_to_capacity_if_used",
      },
      requireHostedBreakerForIcebreakerUse: true,
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_rig",
      },
      {
        kind: "plan_role",
        role: "safe_probe_run",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "target_preference",
        purpose: "host_mu_one_icebreaker_for_spin_chip",
        preferences: [
          "hosted_icebreaker_eligible",
          "installed_icebreaker",
          "program_repairs_missing_coverage",
          "breaker_matching_common_problem_ice",
        ],
        avoid: [
          "target_would_break_host_limit",
          "critical_rig_or_survival_card",
        ],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_139_eurocorpse-tm-spin-chip",
      setId: "proteus",
      collectorNumber: "P139",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
