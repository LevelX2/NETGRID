import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_216_security-purge"),
    title: "Security Purge",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Show the top three cards of R&D to Runner when you score Security Purge. If any of those cards are ice, install and rez them, at no cost. Trash the rest of those cards.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_216_security-purge",
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
        advancementRequirement: 3,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "scored_agenda_reveal_top_rd_install_and_rez_ice_trash_rest",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "reveal_top_rd_install_and_rez_ice_trash_rest",
      count: 3,
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
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
        roleDetail: "free_install_rez_ice",
        confidence: "medium",
        rationale:
          "Review v1 removes the previous remote-scoring pair; free install/rez from R&D is an ICE-tax/glacier setup payoff.",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "scored_agenda_reveal_top_rd_install_and_rez_ice_trash_rest",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_server_for_revealed_ice_install",
            preferences: [
              "blocks_relevant_run_path",
              "protects_agenda_remote",
              "protects_central_access_pressure",
              "central_or_remote_plan_enabler",
            ],
            avoid: ["unaffordable_after_install"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_216_security-purge",
      setId: "originalset-v1",
      collectorNumber: "216",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
