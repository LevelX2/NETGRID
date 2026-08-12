import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_200_encryption-breakthrough"),
    title: "Encryption Breakthrough",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "All code gates have +1 strength. When you score Encryption Breakthrough, reveal as many code gates as you wish. Then, gain 1 for each revealed or rezzed code gate.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_200_encryption-breakthrough",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["research"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 5,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    modifiers: [
      {
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        activeWhile: "scored",
        sourceZone: "corp_scored_agenda",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          subtype: "code_gate",
        },
      },
    ],
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "scored_agenda_reveal_installed_ice_subtype_for_credits",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "reveal_installed_ice_subtype_for_credits",
      subtype: "code_gate",
      creditPerRevealedOrRezzed: 1,
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
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
        roleDetail: "code_gate_tax_anchor",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Encryption Breakthrough to corp.ice_tax_glacier as tax_tool/code_gate_tax_anchor.",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.ice_tax",
        use: "corp.ice_tax",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "low",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "scored_agenda_reveal_installed_ice_subtype_for_credits",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_code_gates_to_reveal_for_credits",
            preferences: [
              "prefer_reveal_when_credit_value_exceeds_information_cost",
              "prefer_already_public_or_low_information_value_code_gates",
            ],
            avoid: ["avoid_revealing_high_value_hidden_ice_without_need"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_200_encryption-breakthrough",
      setId: "originalset-v1",
      collectorNumber: "200",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
