import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_051_rent-to-own-contract"),
    title: "Rent-to-Own Contract",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Rez a piece of ice, at no cost. Put on that ice a number of Term counters equal to its rez cost. At the start of each of your turns, if you have at least [2], lose [2] and remove one of these Term counters; otherwise, put a Term counter on that piece of ice.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_051_rent-to-own-contract",
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
        kind: "fixed",
        credits: 0,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("on_play_free_rez_ice_with_term_counters"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "free_rez_installed_ice_with_counters",
            target: "chosen_installed_ice",
            counterType: "term",
            amount: {
              kind: "target_rez_cost",
            },
            lifecycle: "rent_to_own_start_corp_turn",
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
        roleDetail: "installment_free_rez_ice",
        evidenceProfile: "installment_free_rez_ice",
        confidence: "medium",
        rationale:
          "Operations Semantic Review v2: ice_rez / installment_liability.",
      },
      {
        kind: "risk_interpretation",
        risk: "term_counter_installment_liability",
        severity: "high",
        rationale:
          "Each initial Term counter creates a future two-credit payment; missed payments grow the liability.",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("on_play_free_rez_ice_with_term_counters"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_installment_rez_ice",
            preferences: [
              "current_run_path_relevance",
              "protects_agenda_remote",
              "protects_central_access_pressure",
              "high_rez_cost_relief",
            ],
            avoid: [
              "irrelevant_server_ice",
              "insufficient_post_payment_reserve",
            ],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_051_rent-to-own-contract",
      setId: "proteus",
      collectorNumber: "P051",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
