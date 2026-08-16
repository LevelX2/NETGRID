import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_044_netspace-inverter"),
    title: "Netspace Inverter",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Reverse a fort’s ice cards so that the outermost piece of ice becomes the innermost piece of ice, and so forth. Use this ability only immediately after a successful run on that data fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_044_netspace-inverter",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
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
    successfulRunFollowups: [
      {
        capabilityKey: capabilityKey(
          "successful_run_followups_reverse_ice_on_successful_run_fort_immediately_after_successful_run",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "reverse_ice_on_successful_run_fort",
        timing: "immediately_after_successful_run",
        cost: "none",
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "ice_order_control",
      },
      {
        kind: "line_support",
        lineKey: "runner.run_event_tempo",
        support: "supports",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_044_netspace-inverter",
      setId: "originalset-v1",
      collectorNumber: "044",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
