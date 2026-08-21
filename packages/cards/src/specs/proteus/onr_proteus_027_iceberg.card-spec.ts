import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_027_iceberg"),
    title: "Iceberg",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      '*Do 1 Net damage. *[2]: Iceberg has one "*End the run" subroutine for the present encounter. Use this ability only when Runner encounters Iceberg.',
    capabilityText: [
      {
        capabilityKey: capabilityKey("encounter_add_end_run_subroutine"),
        actionLabel: "Iceberg: Subroutine hinzufügen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_027_iceberg",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["wall"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 4,
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
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_net_damage_one"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "net",
        amount: 1,
        preventable: true,
      },
    ],
    abilities: [
      {
        capabilityKey: capabilityKey("encounter_add_end_run_subroutine"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_encounter",
        costs: [
          {
            kind: "credit",
            amount: 2,
          },
        ],
        effects: [
          {
            kind: "add_current_encounter_additional_subroutine",
            target: "encountered_ice_self",
            append: "after_existing",
            subroutine: {
              kind: "end_the_run",
              visibility: "public",
            },
            visibility: "public",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "plan_role",
        role: "protect_remote",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "paid_end_run_subroutine_ice",
        evidenceProfile: "paid_end_run_subroutine_ice",
        confidence: "medium",
        rationale:
          "ICE Semantic Review v1: Iceberg bestätigt corp.ice_tax_glacier nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_027_iceberg",
      setId: "proteus",
      collectorNumber: "P027",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
