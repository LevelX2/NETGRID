import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_100_wrecking-ball"),
    title: "Wrecking Ball",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[0]: Break wall subroutine. [2]: +1 strength. Whenever you break a wall subroutine with Wrecking Ball, lose [1] from a stealth card.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_100_wrecking-ball",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["icebreaker", "noisy"],
      numeric: {
        installCost: 4,
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
        capabilityKey: capabilityKey("break_wall_with_stealth_tradeoff"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "break_subroutine",
        cost: {
          kind: "credit",
          amount: 0,
        },
        matches: {
          kind: "ice_subtype",
          subtype: "wall",
        },
        onSuccessfulBreak: [
          {
            kind: "lose_bits_from_stealth_sources",
            amount: 1,
            sourceMode: "single_stealth_card",
            optionalIfUnavailable: true,
            trigger: "per_subroutine",
          },
        ],
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
      printingId: "onr_proteus_100_wrecking-ball",
      setId: "proteus",
      collectorNumber: "P100",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
