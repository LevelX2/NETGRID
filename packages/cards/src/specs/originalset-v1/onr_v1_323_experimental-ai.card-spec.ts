import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_323_experimental-ai"),
    title: "Experimental AI",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may advance Experimental AI before and after you rez it. When Runner accesses Experimental AI, trash one program for each advancement counter on it.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_323_experimental-ai",
      },
      {
        source: "project_ruling",
        reference: "docs/source/Netrunner Errata 1.70.md#Experimental AI",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ai", "ambush"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 2,
        trashCost: 0,
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
    accessEffects: [
      {
        capabilityKey: capabilityKey(
          "access_effects_on_access_trash_installed_runner_cards",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "trash_installed_runner_cards",
            target: "program",
            amount: {
              kind: "source_advancement_counter_count",
            },
            visibility: "hidden_info_barrier",
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
        role: "remote_asset_trap",
      },
      {
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ambush_bluff",
      },
      {
        kind: "line_support",
        lineKey: "corp.ambush_bluff",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ambush_bluff",
        role: "punish_payoff",
        roleDetail: "access_program_trash",
        confidence: "high",
        rationale:
          "Access program trash is a concrete ambush payoff; AI/Ambush subtypes remain card data. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
      },
      {
        kind: "tactic_interpretation",
        signal: "access.punish",
        use: "access.punish",
      },
      {
        kind: "tactic_interpretation",
        signal: "remote.ambush",
        use: "remote.ambush",
      },
      {
        kind: "tactic_interpretation",
        signal: "punish.payoff",
        use: "punish.payoff",
      },
      {
        kind: "remote_role",
        role: "ambush",
        threatLevel: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "access_effects_on_access_trash_installed_runner_cards",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "trash_installed_runner_programs",
            preferences: [
              "currently_used_breaker",
              "trash_prevention_high_value_program",
              "high_install_cost_or_memory",
            ],
            avoid: ["low_value_program"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_323_experimental-ai",
      setId: "originalset-v1",
      collectorNumber: "323",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
