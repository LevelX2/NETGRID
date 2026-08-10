import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_082_bulldozer"),
    title: "Bulldozer",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[1]: Break wall subroutine. [2]: +1 strength. If Bulldozer breaks all the subroutines of a wall, and the next piece of ice encountered during this run is a sentry, break one of the subroutines of that sentry, at no cost. Whenever you break a wall subroutine with Bulldozer, lose a total of [2] from stealth cards.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_082_bulldozer",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["icebreaker", "noisy"],
      numeric: {
        installCost: 7,
        memoryCost: 1,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 4,
      },
    },
    icebreakerAbilities: [
      {
        capabilityKey: capabilityKey(
          "break_wall_with_stealth_tradeoff_and_sentry_reward",
        ),
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
        special: {
          kind: "set_next_sentry_free_break_after_fully_breaking_wall",
        },
        visibility: "public",
      },
      {
        capabilityKey: capabilityKey("pump_strength_one"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "increase_strength",
        cost: {
          kind: "credit",
          amount: 2,
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
        role: "safe_probe_run",
      },
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
      printingId: "onr_proteus_082_bulldozer",
      setId: "proteus",
      collectorNumber: "P082",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
