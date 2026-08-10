import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_071_raymond-ellison"),
    title: "Raymond Ellison",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Install Raymond Ellison only in a subsidiary data fort. [T]: Remove any number of advancement counters from cards installed in this data fort. Gain [3] for each advancement counter removed. Use this ability only during a run. At the end of the run, return to the bank any of the bits gained that you did not spend.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "during_run_tap_advancement_for_run_credits",
        ),
        actionLabel:
          "Raymond Ellison: Advancement-Counter für Run-Credits entfernen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_071_raymond-ellison",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["sysop"],
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
    installCapabilities: [
      {
        kind: "install_only_inside_subsidiary_data_fort",
        visibility: "public",
      },
    ],
    abilities: [
      {
        capabilityKey: capabilityKey(
          "during_run_tap_advancement_for_run_credits",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_during_run",
        costs: [
          {
            kind: "tap_source",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "remove_same_fort_advancement_counters_for_run_credits",
            creditsPerCounter: 3,
            maxAmount: "all",
            cleanup: "run_end",
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
        role: "build_scoring_remote",
      },
      {
        kind: "strategic_role",
        role: "support_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.economy_rez_reserve",
      },
      {
        kind: "line_support",
        lineKey: "corp.economy_rez_reserve",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.economy_rez_reserve",
        role: "support_tool",
        roleDetail: "run_temporary_credit_reserve",
        evidenceProfile: "run_temporary_credit_reserve",
        confidence: "medium",
        rationale:
          "Converts advancement counters into temporary run credits; support only.",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "target_preference",
        purpose: "remove_advancement_counters_for_temporary_credits",
        preferences: [],
        avoid: ["hidden_info_dependent_choice"],
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
        rationale:
          "Migrated from reviewed Proteus hint onr_proteus_071_raymond-ellison.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_071_raymond-ellison",
      setId: "proteus",
      collectorNumber: "P071",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
