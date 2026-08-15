import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_363_olivia-salazar"),
    title: "Olivia Salazar",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "For half cost, rounded down, rez a piece of ice installed on this fort. Derez that ice at the end of the run. Use this ability only once during each run on this fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_363_olivia-salazar",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["sysop"],
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
    fortRunWindows: [
      {
        capabilityKey: capabilityKey(
          "fort_run_windows_discounted_rez_ice_on_this_fort_during_run_on_this_fort",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "discounted_rez_ice_on_this_fort",
        timing: "during_run_on_this_fort",
        discount: "half_rez_cost_rounded_down",
        target: "unrezzed_ice_on_this_fort",
        limit: "once_per_run_per_source",
        endOfRun: "derez_target",
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_upgrade_rez_support",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "temporary_ice_rez_support",
        confidence: "medium",
        rationale:
          "Half-cost temporary rez can activate ICE tax during a run, with derez drawback.",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
      {
        kind: "remote_role",
        role: "scoring_protection",
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
          "fort_run_windows_discounted_rez_ice_on_this_fort_during_run_on_this_fort",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "temporarily_rez_ice_on_fort",
            preferences: [
              "high_run_denial_payoff",
              "adds_relevant_encounter_tax",
              "current_run_path_relevance",
            ],
            avoid: ["low_impact_ice", "already_cheap_to_break"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_363_olivia-salazar",
      setId: "originalset-v1",
      collectorNumber: "363",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
