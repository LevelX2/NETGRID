import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_059_government-contract"),
    title: "Government Contract",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may advance Government Contract before and after you rez it. Government Contract advancement counter: Gain [3]. Use these bits only to pay for installing or rezzing cards. When the turn ends, return to the bank any of the [3] you did not spend.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "corp_main_spend_advancement_for_install_rez_credits",
        ),
        actionLabel:
          "Government Contract: 1 Advancement-Counter für 3 Installations-/Rez-Credits ausgeben",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_059_government-contract",
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
        rezCost: 2,
        trashCost: 2,
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
          "corp_main_spend_advancement_for_install_rez_credits",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "advancement_counter",
            amount: 1,
            source: "source",
          },
        ],
        condition: {
          kind: "source_has_advancement_counters",
          minimum: 1,
        },
        effects: [
          {
            kind: "gain_temporary_corp_credits",
            recipient: "corp",
            amount: 3,
            usableFor: "install_or_rez",
            cleanup: "end_of_turn",
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
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "line_support",
        lineKey: "corp.economy_rez_reserve",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.economy_rez_reserve",
        role: "engine_anchor",
        roleDetail: "install_rez_reserve",
        evidenceProfile: "install_rez_reserve_counter",
        confidence: "high",
        rationale:
          "Advanceable counters convert to temporary install/rez credits; side condition is not limited to during-run use.",
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
          "Migrated from reviewed Proteus hint onr_proteus_059_government-contract.",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
        rationale:
          "Migrated from reviewed Proteus hint onr_proteus_059_government-contract.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_059_government-contract",
      setId: "proteus",
      collectorNumber: "P059",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
