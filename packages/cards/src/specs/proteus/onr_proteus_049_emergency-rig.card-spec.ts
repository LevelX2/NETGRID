import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_049_emergency-rig"),
    title: "Emergency Rig",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Rez a piece of ice, at no cost. Put X Kludge counters on that piece of ice; X cannot be 0. At the start of each of your turns, remove a Kludge counter. Trash that piece of ice when the last Kludge counter is removed from it.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_049_emergency-rig",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["transactions"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "variable_x",
        minimumX: 1,
        creditsPerX: 1,
        maximumX: {
          kind: "context",
        },
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "on_play_free_rez_ice_with_kludge_counters",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "free_rez_installed_ice_with_counters",
            target: "chosen_installed_ice",
            counterType: "kludge",
            amount: {
              kind: "chosen_x_min_one",
            },
            lifecycle: "remove_one_counter_start_corp_turn_trash_on_last",
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
        role: "enabler",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "enabler",
        roleDetail: "temporary_free_rez_ice",
        evidenceProfile: "temporary_free_rez_ice",
        confidence: "medium",
        rationale: "Operations Semantic Review v2: ice_rez / temporary_rez.",
      },
      {
        kind: "strategic_exchange",
        exchange: "temporary_resource",
      },
      {
        kind: "risk_interpretation",
        risk: "temporary_rez_liability",
        severity: "high",
        rationale:
          "The selected X buys time but the rezzed ICE is trashed when its final Kludge counter is removed.",
      },
      {
        kind: "target_preference",
        purpose: "temporarily_rez_relevant_ice",
        preferences: [
          "protects_agenda_remote",
          "protects_central_access_pressure",
          "high_rez_cost_relief",
          "high_run_denial_payoff",
        ],
        avoid: ["irrelevant_server_ice", "low_impact_ice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_049_emergency-rig",
      setId: "proteus",
      collectorNumber: "P049",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
