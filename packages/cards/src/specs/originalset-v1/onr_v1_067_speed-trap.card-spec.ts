import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_067_speed-trap"),
    title: "Speed Trap",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "0: Jack out before an upgrade or node takes effect. Use this ability only immediately after the Corp has rezzed that upgrade or node.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_067_speed-trap",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["detection"],
      numeric: {
        installCost: 0,
        memoryCost: 1,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    runEncounterInterventions: [
      {
        capabilityKey: capabilityKey(
          "run_encounter_interventions_jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
        timing: "after_corp_rezzes_upgrade_or_node_before_effect",
        cost: {
          kind: "credit",
          amount: 0,
        },
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategy_anchor",
        strategyKey: "runner.run_event_tempo",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_067_speed-trap",
      setId: "originalset-v1",
      collectorNumber: "067",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
