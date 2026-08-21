import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_018_reclamation-project"),
    title: "Reclamation Project",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Search the archives for any number of ice cards. Show those cards to Runner, then store them in HQ. Playing a double operation costs two consecutive actions this turn instead of one.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_018_reclamation-project",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["double"],
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
    corpUtility: {
      capabilityKey: capabilityKey("return_archives_ice_to_hq"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "corp_archives_to_hq",
      filter: {
        cardType: "ice",
      },
      maxSelections: "all",
      revealToRunner: true,
      playCost: {
        kind: "printed",
        additionalClicks: 1,
      },
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "ice_recovery",
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
        roleDetail: "archives_ice_restock",
        confidence: "medium",
        rationale:
          "Operations Semantic Review v2: ice_recovery / glacier_support. Review-v2-Rolle recovery_enabler wird als validierbare Hauptrolle enabler mit roleDetail gespeichert.",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "low",
      },
      {
        kind: "target_preference",
        purpose: "choose_archives_ice_subset_for_hq_recovery",
        preferences: [
          "best_cards_for_current_plan",
          "protects_agenda_remote",
          "protects_central_access_pressure",
          "known_or_rezzed_ice",
        ],
        avoid: [
          "low_impact_ice",
          "avoid_revealing_high_value_hidden_ice_without_need",
        ],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_018_reclamation-project",
      setId: "classic",
      collectorNumber: "C018",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
