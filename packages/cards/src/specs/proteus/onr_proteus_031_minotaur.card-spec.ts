import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_031_minotaur"),
    title: "Minotaur",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      'For each rezzed code gate or wall installed outside Minotaur, Minotaur has one "*End the run" subroutine.',
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_031_minotaur",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 6,
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
    modifiers: [
      {
        kind: "additional_subroutine",
        activeWhile: "rezzed",
        sourceZone: "corp_installed",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          sourceCardOnly: true,
        },
        append: "after_existing",
        repeat: {
          kind: "for_each_rezzed_installed_ice",
          subtypeAnyOf: ["code_gate", "wall"],
          excludeSource: true,
          scope: "outside_source_same_server",
          subtypeMatch: "effective_current_subtypes",
        },
        subroutine: {
          kind: "end_the_run",
          visibility: "public",
        },
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
        roleDetail: "position_scaling_etr_ice",
        evidenceProfile: "position_scaling_etr_ice",
        confidence: "high",
        rationale:
          "v2: Minotaur erzeugt position-skalierende ETR-Subroutinen, aber keinen Strength-Modifier.",
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
      printingId: "onr_proteus_031_minotaur",
      setId: "proteus",
      collectorNumber: "P031",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
