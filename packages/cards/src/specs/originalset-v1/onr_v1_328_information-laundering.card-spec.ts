import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_328_information-laundering"),
    title: "Information Laundering",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may advance Information Laundering before and after you rez it. A, T: Gain [4] for each advancement counter on Information Laundering.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_328_information-laundering",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["transactions"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 1,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    advanceable: {
      while: "installed_before_and_after_rez",
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_gain_credits_per_advancement_counter_on_source",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "gain_credits_per_advancement_counter_on_source",
            recipient: "controller",
            amountPerCounter: 4,
            visibility: "public",
          },
          {
            kind: "trash_source",
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
          "Advanceable counter cashout; `advance.corp_counter_bank` already carries the advanceable-counter context, so a separate advanceable-cashout synonym is unnecessary.",
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
        rating: "low",
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
      printingId: "onr_v1_328_information-laundering",
      setId: "originalset-v1",
      collectorNumber: "328",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
