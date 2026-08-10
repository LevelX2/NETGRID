import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_076_syd-meyer-superstores"),
    title: "Syd Meyer Superstores",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "A: Trash a rezzed piece of ice. Gain [4].",
    capabilityText: [
      {
        capabilityKey: capabilityKey("corp_main_trash_rezzed_ice_for_credits"),
        actionLabel:
          "Syd Meyer Superstores: gerezztes ICE trashen und 4 Credits erhalten",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_076_syd-meyer-superstores",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["asset", "node"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 2,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("corp_main_trash_rezzed_ice_for_credits"),
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
            kind: "trash_own_rezzed_ice_for_credits",
            target: "chosen_own_rezzed_ice",
            gainCredits: 4,
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
        role: "recover_economy",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.asset_economy",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.economy_rez_reserve",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "medium",
        rationale:
          "Migrated from reviewed Proteus hint onr_proteus_076_syd-meyer-superstores.",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
        rationale:
          "Migrated from reviewed Proteus hint onr_proteus_076_syd-meyer-superstores.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_076_syd-meyer-superstores",
      setId: "proteus",
      collectorNumber: "P076",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
