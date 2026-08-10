import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_047_pile-driver"),
    title: "Pile Driver",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "3: Break up to four wall subroutines on a single piece of ice. 1: +1 strength. Whenever you use Pile Driver’s break-walls subroutine, lose a total of 3 from stealth cards.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_047_pile-driver",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["icebreaker", "noisy"],
      numeric: {
        installCost: 1,
        memoryCost: 1,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 7,
      },
    },
    icebreakerAbilities: [
      {
        capabilityKey: capabilityKey("icebreaker_abilities_break_subroutine"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "break_subroutine",
        cost: {
          kind: "credit",
          amount: 3,
        },
        matches: {
          kind: "ice_subtype",
          subtype: "wall",
        },
        count: 4,
        onSuccessfulBreak: [
          {
            kind: "lose_bits_from_stealth_sources",
            amount: 3,
            sourceMode: "any_stealth_cards",
            optionalIfUnavailable: true,
            trigger: "per_ability_use",
          },
        ],
        visibility: "public",
      },
      {
        capabilityKey: capabilityKey("icebreaker_abilities_increase_strength"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "increase_strength",
        cost: {
          kind: "credit",
          amount: 1,
        },
        amount: 1,
        duration: "current_encounter",
        visibility: "public",
      },
    ],
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
        role: "run_support",
      },
      {
        kind: "tactic_interpretation",
        signal: "coverage.breaker",
        use: "coverage.breaker",
      },
      {
        kind: "target_preference",
        purpose: "break_subroutines_that_preserve_run_goal",
        preferences: ["current_run_path_relevance", "high_run_denial_payoff"],
        avoid: [],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_047_pile-driver",
      setId: "originalset-v1",
      collectorNumber: "047",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
