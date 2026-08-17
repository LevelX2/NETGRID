import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_347_vapor-ops"),
    title: "Vapor Ops",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may advance Vapor Ops before and after you rez it.\nVapor Ops advancement counter: Gain [1].\nA: Move any number of advancement counters from Vapor Ops to another installed card that can be advanced.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_gain_credits",
        ),
        actionLabel: "Vapor Ops: Advancement-Counter für 1 Credit ausgeben",
      },
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_move_advancement_counters",
        ),
        actionLabel: "Vapor Ops: Advancement-Counter bewegen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_347_vapor-ops",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
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
          "abilities_activated_corp_main_gain_credits",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_paid",
        additionalTimings: [{ timing: "corp_during_run" }],
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
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
        ],
      },
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_move_advancement_counters",
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
        condition: {
          kind: "source_has_advancement_counters",
          minimum: 1,
        },
        effects: [
          {
            kind: "move_advancement_counters",
            source: "source_card",
            target: "chosen_installed_advanceable_card",
            maxAmount: "all",
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
        kind: "plan_role",
        role: "remote_asset_agenda_support",
      },
      {
        kind: "strategic_role",
        role: "scoring_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.fast_advance",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.fast_advance",
        role: "scoring_tool",
        roleDetail: "advancement_enabler",
        confidence: "high",
        rationale:
          "Counter bank and transfer can convert into score windows; credit cashout is secondary support, not separate strategy evidence.",
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
      printingId: "onr_v1_347_vapor-ops",
      setId: "originalset-v1",
      collectorNumber: "347",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
