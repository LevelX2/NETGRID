import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_116_pirate-broadcast"),
    title: "Pirate Broadcast",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Make a run on each data fort. Score 1 agenda point if all the runs are successful. Forgo your next action if any of the runs are not successful.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_116_pirate-broadcast",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
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
        credits: 1,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("on_play_run_each_fort_sequence"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "make_run_each_data_fort_sequence",
            onAllSuccessful: "gain_runner_event_agenda_point",
            onAnyUnsuccessful: "forgo_next_action",
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
        role: "multi_server_run_sequence",
      },
      { kind: "strategic_role", role: "payoff_anchor" },
      {
        kind: "line_support",
        lineKey: "runner.run_event_tempo",
        support: "supports",
      },
      {
        kind: "strategic_exchange",
        exchange: "agenda_point_for_multi_server_run_sequence",
      },
      {
        kind: "risk_interpretation",
        risk: "future_action_debt_on_failed_run_sequence",
        severity: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_116_pirate-broadcast",
      setId: "proteus",
      collectorNumber: "P116",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
