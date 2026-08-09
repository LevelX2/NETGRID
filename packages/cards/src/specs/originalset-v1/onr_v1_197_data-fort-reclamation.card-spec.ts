import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const buildNewRemote = capabilityKey("hq_to_new_remote_install_rez");

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_197_data-fort-reclamation"),
    title: "Data Fort Reclamation",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Gain [10] and choose up to four cards stored in HQ when you score Data Fort Reclamation. Create a new data fort using the cards chosen. Install the cards one at a time; you may rez them when you install them. Then, return to the bank any of the [10] not spent.",
    capabilityText: [
      {
        capabilityKey: buildNewRemote,
        actionLabel: "HQ-Karten in einem neuen Data Fort installieren",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_197_data-fort-reclamation",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["gray-ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 4,
        agendaPoints: 2,
      },
      playCost: null,
      strength: { kind: "not_applicable" },
    },
    scoredAgenda: {
      capabilityKey: buildNewRemote,
      addressability: ["plan", "choice", "quote", "debug"],
      kind: "score_install_hq_cards_into_new_remote_then_rez",
      sourceZone: "hq",
      targetServer: "new_remote",
      allowedCards: "corp_installable",
      maxCards: 4,
      temporaryCredits: {
        amount: 10,
        usableFor: "rez_installed_cards_from_sequence",
        returnUnused: true,
      },
      optionalRez: true,
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      { kind: "strategic_role", role: "engine_anchor" },
      { kind: "plan_role", role: "corp_score_agenda" },
      { kind: "plan_role", role: "corp_agenda_ability" },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "engine_anchor",
        roleDetail: "remote_setup_engine",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Data Fort Reclamation to corp.remote_scoring as engine_anchor/remote_setup_engine.",
      },
    ],
    capabilities: [
      {
        capabilityKey: buildNewRemote,
        annotations: [
          { kind: "plan_owner", owner: "corp.score_agenda" },
          {
            kind: "target_preference",
            purpose: "create_remote_with_best_hq_cards",
            preferences: [
              "prefer_option_that_protects_agenda_or_remote_pressure",
              "central_or_remote_plan_enabler",
            ],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_197_data-fort-reclamation",
      setId: "originalset-v1",
      collectorNumber: "197",
      rarity: "vital",
    },
  ],
  publication: { schemaVersion: "card-publication-v1", status: "active" },
} satisfies CardSpec;
