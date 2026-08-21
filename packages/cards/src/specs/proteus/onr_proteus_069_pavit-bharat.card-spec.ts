import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_069_pavit-bharat"),
    title: "Pavit Bharat",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Install Pavit only in a subsidiary data fort. When you rez Pavit, uninstall all cards installed in this fort and store them in HQ. Install an equal number of cards from HQ in this fort. Rez Pavit only when Runner has passed the last piece of ice on this fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_069_pavit-bharat",
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
    installCapabilities: [
      {
        kind: "install_only_inside_subsidiary_data_fort",
        visibility: "public",
      },
    ],
    lifecycle: {
      on_rez: [
        {
          kind: "replace_source_fort_cards_from_hq",
          include: "root",
          installCost: "free",
          rezTiming: "after_runner_passed_last_ice_on_source_fort",
          visibility: "hidden_info_barrier",
        },
      ],
    },
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
        role: "defensive_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "remote_content_swap_defense",
        evidenceProfile: "remote_content_swap_defense",
        confidence: "medium",
        rationale:
          "Can swap remote contents after the last ICE and defend agenda/trap remotes; hidden info remains controller-only.",
      },
      {
        kind: "target_preference",
        purpose: "replace_installed_fort_cards_from_hq",
        preferences: [
          "best_cards_for_current_plan",
          "protects_agenda_remote",
          "advanceable_ambush_with_access_payoff",
        ],
        avoid: ["next_turn_required_card"],
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
      printingId: "onr_proteus_069_pavit-bharat",
      setId: "proteus",
      collectorNumber: "P069",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
