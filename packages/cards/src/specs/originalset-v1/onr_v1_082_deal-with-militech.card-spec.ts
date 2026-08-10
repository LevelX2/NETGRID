import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_082_deal-with-militech"),
    title: "Deal with Militech",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if you liberated any Research agendas this turn. Put a Militech counter on each of your icebreakers. A Militech counter gives the icebreaker it is on +1 strength.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_082_deal-with-militech",
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
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_on_play_add_counter_to_all_installed_runner_icebreakers",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        condition: {
          kind: "runner_liberated_agenda_subtype_this_turn",
          subtype: "research",
        },
        effects: [
          {
            kind: "add_counter_to_all_installed_runner_icebreakers",
            counterType: "militech",
            amount: 1,
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
        role: "agenda_reward",
      },
      {
        kind: "plan_role",
        role: "build_rig",
      },
      {
        kind: "strategic_role",
        role: "support_tool",
      },
      {
        kind: "tactic_interpretation",
        signal: "coverage.breaker",
        use: "coverage.breaker",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_082_deal-with-militech",
      setId: "originalset-v1",
      collectorNumber: "082",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
