import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_312_chicago-branch"),
    title: "Chicago Branch",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "A, [3]: Add two advancement counters to an installed card that can be advanced.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_distribute_advancement_counters",
        ),
        actionLabel: "Chicago Branch: 2 Advancement-Counter legen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_312_chicago-branch",
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
        rezCost: 2,
        trashCost: 1,
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
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_distribute_advancement_counters",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
          {
            kind: "credit",
            amount: 3,
          },
        ],
        effects: [
          {
            kind: "distribute_advancement_counters",
            amount: 2,
            target: "installed_advanceable_cards",
            distribution: "single_target",
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
        role: "remote_asset_agenda_support",
      },
      {
        kind: "strategic_role",
        role: "scoring_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.fast_advance",
      },
      {
        kind: "line_support",
        lineKey: "corp.fast_advance",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.fast_advance",
        role: "scoring_tool",
        roleDetail: "advancement_enabler",
        confidence: "high",
        rationale:
          "Repeatable two-counter placement is direct score-window support.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "scoring_tool",
        roleDetail: "advancement_enabler",
        confidence: "medium",
        rationale:
          "Advancement acceleration also supports remote scoring, but it is not a protection effect.",
      },
      {
        kind: "remote_role",
        role: "score_acceleration",
        threatLevel: "medium",
      },
      {
        kind: "target_preference",
        purpose: "advance_high_value_corp_card",
        preferences: [
          "prefer_option_that_protects_agenda_or_remote_pressure",
          "central_or_remote_plan_enabler",
        ],
        avoid: ["hidden_info_dependent_choice"],
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
      printingId: "onr_v1_312_chicago-branch",
      setId: "originalset-v1",
      collectorNumber: "312",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
