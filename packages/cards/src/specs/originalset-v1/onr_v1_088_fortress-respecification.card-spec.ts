import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_088_fortress-respecification"),
    title: "Fortress Respecification",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if you made a successful run this turn. Rearrange the ice installed on the last fort on which you made a successful run. This does not expose any concealed ice.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_088_fortress-respecification",
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
    hiddenReplacementLongtail: {
      capabilityKey: capabilityKey(
        "hidden_replacement_longtail_successful_run_fort_ice_reorder",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "successful_run_fort_ice_reorder",
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "contest_remote",
      },
      {
        kind: "plan_role",
        role: "safe_probe_run",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.run_event_tempo",
      },
      {
        kind: "target_preference",
        purpose: "fort_reorder",
        preferences: [],
        avoid: [],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_088_fortress-respecification",
      setId: "originalset-v1",
      collectorNumber: "088",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
