import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_v1_314_corporate-negotiating-center",
    ),
    title: "Corporate Negotiating Center",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "At the start of each of your turns, gain 1 for each agenda card stored in HQ that you show to Runner.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_314_corporate-negotiating-center",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["asset"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 3,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    lifecycle: {
      start_of_corp_turn: [
        {
          effects: [
            {
              kind: "show_hq_agendas_for_credits",
              creditPerAgenda: 1,
              visibility: "hidden_info_barrier",
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
        kind: "plan_role",
        role: "hidden_information_pressure",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.asset_economy",
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
      printingId: "onr_v1_314_corporate-negotiating-center",
      setId: "originalset-v1",
      collectorNumber: "314",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
