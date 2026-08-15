import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_077_anonymous-tip"),
    title: "Anonymous Tip",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Derez a piece of black ice of your choice.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_077_anonymous-tip",
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
        credits: 3,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_on_play_derez_rezzed_black_ice",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "derez_rezzed_black_ice",
            target: "chosen_rezzed_black_ice",
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
        role: "ice_sabotage",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_on_play_derez_rezzed_black_ice",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "black_ice_derez",
            preferences: [
              "high_rez_cost_relief",
              "blocks_relevant_run_path",
              "high_run_denial_payoff",
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
      printingId: "onr_v1_077_anonymous-tip",
      setId: "originalset-v1",
      collectorNumber: "077",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
