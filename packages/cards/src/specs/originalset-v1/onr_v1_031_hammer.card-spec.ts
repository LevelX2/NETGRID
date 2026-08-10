import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_031_hammer"),
    title: "Hammer",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[1]: Break wall subroutine. [1]: +1 strength. Whenever you break a wall subroutine with Hammer, lose a total of [2] from stealth cards.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_031_hammer",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["icebreaker", "noisy"],
      numeric: {
        installCost: 2,
        memoryCost: 1,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 2,
      },
    },
    icebreakerAbilities: [
      {
        capabilityKey: capabilityKey("icebreaker_abilities_break_subroutine"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "break_subroutine",
        cost: {
          kind: "credit",
          amount: 1,
        },
        matches: {
          kind: "ice_subtype",
          subtype: "wall",
        },
        onSuccessfulBreak: [
          {
            kind: "lose_bits_from_stealth_sources",
            amount: 2,
            sourceMode: "any_stealth_cards",
            optionalIfUnavailable: true,
            trigger: "per_subroutine",
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
        kind: "tactic_interpretation",
        signal: "coverage.breaker",
        use: "coverage.breaker",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_031_hammer",
      setId: "originalset-v1",
      collectorNumber: "031",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
