import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_v1_112_stumble-through-wilderspace",
    ),
    title: "Stumble through Wilderspace",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Make a run. You have +9 link for every trace attempt made during that run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_112_stumble-through-wilderspace",
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
        credits: 2,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("abilities_on_play_make_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "make_run",
            target: {
              kind: "chosen_server",
            },
            runTraceLinkBonus: 9,
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
        role: "run_pressure",
      },
      {
        kind: "plan_role",
        role: "trace_bid_support",
      },
      {
        kind: "line_support",
        lineKey: "runner.run_event_tempo",
        support: "supports",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("abilities_on_play_make_run"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_trace_heavy_run_server",
            preferences: [
              "server_relevant_to_current_plan",
              "blocks_relevant_run_path",
              "current_run_path_relevance",
            ],
            avoid: ["option_with_no_visible_current_payoff"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_112_stumble-through-wilderspace",
      setId: "originalset-v1",
      collectorNumber: "112",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
