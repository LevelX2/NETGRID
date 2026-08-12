import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_113_synchronized-attack-on-hq"),
    title: "Synchronized Attack on HQ",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if you made a successful run on HQ this turn. The Corp discards all cards. The Corp can retain cards by paying [2] for each card not discarded.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_113_synchronized-attack-on-hq",
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
        credits: 4,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_on_play_corp_discard_hq_with_retain_payment",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        condition: {
          kind: "runner_made_successful_run_on_server_this_turn",
          server: "hq",
        },
        effects: [
          {
            kind: "corp_discard_hq_with_retain_payment",
            retainCostPerCard: 2,
            visibility: "hidden_info_barrier",
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
        role: "pressure_hq",
      },
      {
        kind: "strategic_role",
        role: "payoff_anchor",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_113_synchronized-attack-on-hq",
      setId: "originalset-v1",
      collectorNumber: "113",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
