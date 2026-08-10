import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_344_spinn-public-relations"),
    title: "Spinn® Public Relations",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Take [1] from Spinn(R) Public Relations, if it has any bits, at the start of each of your turns. A: Put [3] from the bank on Spinn(R) Public Relations.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_344_spinn-public-relations",
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
        rezCost: 1,
        trashCost: 4,
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
          ],
        },
      ],
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_add_hosted_credits",
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
            kind: "add_hosted_credits",
            target: "source",
            amount: 3,
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
          "Installed banked economy supports asset economy without using Transactions as signal. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
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
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_344_spinn-public-relations",
      setId: "originalset-v1",
      collectorNumber: "344",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
