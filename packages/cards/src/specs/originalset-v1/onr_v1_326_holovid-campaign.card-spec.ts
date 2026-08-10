import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_326_holovid-campaign"),
    title: "Holovid Campaign",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put 12 from the bank on Holovid Campaign when you rez it. Take 1 from Holovid Campaign at the start of each of your turns. When all the bits have been removed, trash Holovid Campaign.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_326_holovid-campaign",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["advertisement"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 4,
        trashCost: 7,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    lifecycle: {
      on_rez: [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 12,
          visibility: "public",
        },
      ],
      start_of_corp_turn: [
        {
          condition: {
            kind: "source_has_hosted_credits",
          },
          effects: [
            {
              kind: "take_hosted_credits",
              source: "source",
              recipient: "controller",
              amount: 1,
              mode: "up_to_amount_if_available",
              visibility: "public",
            },
            {
              kind: "trash_source_when_empty",
              source: "source",
              visibility: "public",
            },
          ],
        },
      ],
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_asset_economy",
      },
      {
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.asset_economy",
      },
      {
        kind: "line_support",
        lineKey: "corp.asset_economy",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.asset_economy",
        role: "engine_anchor",
        roleDetail: "installed_economy_engine",
        confidence: "medium",
        rationale:
          "Installed credit drip creates asset-economy pressure; Advertisement remains a subtype. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "remote_role",
        role: "asset_economy",
        threatLevel: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_326_holovid-campaign",
      setId: "originalset-v1",
      collectorNumber: "326",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
