import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_086_forged-activation-orders"),
    title: "Forged Activation Orders",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Choose a piece of ice. The Corp either rezzes that piece of ice or trashes it.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_086_forged-activation-orders",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["sabotage"],
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
        credits: 1,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_on_play_corp_choice_rez_or_trash_ice",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "corp_choice_rez_or_trash_ice",
            target: "chosen_installed_ice",
            visibility: "public",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_on_play_corp_choice_rez_or_trash_ice",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_publicly_assessable_ice_for_rez_or_trash_pressure",
            preferences: [
              "valuable_known_rezzed_ice_with_no_legal_rez_route",
              "high_visible_rez_burden_relative_to_corp_credits",
              "important_server_position_for_current_or_followup_run",
            ],
            avoid: [
              "infer_unrezzed_ice_identity",
              "cheap_irrelevant_or_intentionally_rezzable_decoy",
            ],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_086_forged-activation-orders",
      setId: "originalset-v1",
      collectorNumber: "086",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
