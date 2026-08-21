import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const jettisonRezzedIce = capabilityKey(
  "abilities_on_play_pay_rez_cost_to_trash_rezzed_ice",
);

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_080_core-command-jettison-ice"),
    title: "Core Command: Jettison Ice",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if you made a successful run on HQ this turn. Pay the rez cost of a piece of rezzed ice to trash it.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_080_core-command-jettison-ice",
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
        credits: 0,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: jettisonRezzedIce,
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        condition: {
          kind: "runner_made_successful_run_on_server_this_turn",
          server: "hq",
        },
        effects: [
          {
            kind: "pay_rez_cost_to_trash_rezzed_ice",
            target: "chosen_rezzed_ice",
            visibility: "public",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [],
    capabilities: [
      {
        capabilityKey: jettisonRezzedIce,
        annotations: [
          {
            kind: "target_preference",
            purpose: "successful_hq_run_rezzed_ice_trash",
            preferences: [
              "blocks_relevant_run_path",
              "relevant_server_ice",
              "high_rez_cost_tax",
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
      printingId: "onr_v1_080_core-command-jettison-ice",
      setId: "originalset-v1",
      collectorNumber: "080",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
