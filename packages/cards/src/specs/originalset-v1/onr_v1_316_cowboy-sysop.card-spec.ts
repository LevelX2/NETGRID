import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_316_cowboy-sysop"),
    title: "Cowboy Sysop",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "A: Choose one of your installed cards to be uninstalled. Store it in HQ.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_316_cowboy-sysop",
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
        rezCost: 0,
        trashCost: 3,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    corpUtility: {
      capabilityKey: capabilityKey(
        "corp_utility_move_installed_corp_card_to_hq",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "move_installed_corp_card_to_hq",
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "board_recycling",
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
          "corp_utility_move_installed_corp_card_to_hq",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "protect_or_reuse_installed_corp_card",
            preferences: [
              "best_cards_for_current_plan",
              "best_cards_for_current_state",
              "lowest_near_term_value",
            ],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_316_cowboy-sysop",
      setId: "originalset-v1",
      collectorNumber: "316",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
