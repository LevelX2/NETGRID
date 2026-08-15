import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_294_new-blood"),
    title: "New Blood",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Conceal all revealed but unrezzed ice; then rearrange your installed ice by swapping pairs of ice while Runner looks away.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_294_new-blood",
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
    hiddenReplacementLongtail: {
      capabilityKey: capabilityKey(
        "hidden_replacement_longtail_conceal_and_reorder_installed_ice",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "conceal_and_reorder_installed_ice",
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "defensive_tool",
        roleDetail: "ice_conceal_rearrange",
        confidence: "medium",
        rationale:
          "Operations Semantic Review v2: ice_rearrange_conceal / glacier_support.",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "hidden_replacement_longtail_conceal_and_reorder_installed_ice",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "conceal_and_reorder_installed_ice",
            preferences: [
              "protects_agenda_remote",
              "protects_central_access_pressure",
              "high_run_denial_payoff",
              "adds_relevant_encounter_tax",
            ],
            avoid: ["low_impact_ice", "irrelevant_server_ice"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_294_new-blood",
      setId: "originalset-v1",
      collectorNumber: "294",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
