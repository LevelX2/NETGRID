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
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "hidden_replacement_longtail_successful_run_fort_ice_reorder",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "reorder_bound_successful_run_fort_ice",
            preferences: [
              "order_known_rezzed_ice_for_future_break_cost",
              "sequence_known_etr_damage_and_tax_for_followup_run",
              "preserve_unknown_ice_as_unknown_positions",
            ],
            avoid: [
              "infer_concealed_ice_identity",
              "treat_bound_fort_as_free_target_choice",
            ],
          },
        ],
      },
    ],
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
