import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_317_data-masons"),
    title: "Data Masons",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Walls cost 2 less to rez and get +1 strength while Data Masons is rezzed.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [{ source: "card_text", reference: "onr_v1_317_data-masons" }],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 1,
        trashCost: 1,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: { kind: "not_applicable" },
    },
    modifiers: [
      {
        kind: "rez_cost",
        operation: "reduce",
        amount: 2,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: { cardType: "ice", subtype: "wall" },
      },
      {
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: { side: "corp", cardType: "ice", subtype: "wall" },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      { kind: "strategic_role", role: "tax_tool" },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "ice_tax_support",
        confidence: "high",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_317_data-masons",
      setId: "originalset-v1",
      collectorNumber: "317",
      rarity: "rare",
    },
  ],
  publication: { schemaVersion: "card-publication-v1", status: "active" },
} satisfies CardSpec;
