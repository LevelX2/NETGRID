import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_374_washington-d-c-city-grid"),
    title: "Washington, D.C., City Grid",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "The difficulty of agendas installed inside this fort is reduced by 1.\nRez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_374_washington-d-c-city-grid",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["region"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 7,
        trashCost: 6,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    modifiers: [
      {
        kind: "agenda_difficulty",
        operation: "reduce",
        amount: 1,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        side: "corp",
        visibility: "public",
        appliesTo: {
          cardType: "agenda",
          sameServerAsSource: true,
        },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_upgrade_agenda_support",
      },
      {
        kind: "strategic_role",
        role: "scoring_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.remote_scoring",
      },
      {
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "scoring_tool",
        roleDetail: "agenda_difficulty_discount",
        confidence: "high",
        rationale:
          "Agenda difficulty discount in this remote opens scoring windows.",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
      {
        kind: "remote_role",
        role: "scoring_protection",
        threatLevel: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_374_washington-d-c-city-grid",
      setId: "originalset-v1",
      collectorNumber: "374",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
