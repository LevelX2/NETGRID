import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_v1_157_crash-everett-inventive-fixer",
    ),
    title: "Crash Everett, Inventive Fixer",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever you draw one or more cards from your stack, draw an extra card; then choose one of the cards drawn and either trash it or return it to the top of your stack. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_157_crash-everett-inventive-fixer",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["connection", "unique"],
      numeric: {
        installCost: 2,
        memoryCost: null,
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
    unique: {
      kind: "unique_by_title",
      controller: "runner",
    },
    remainingReplacementLongtail: {
      capabilityKey: capabilityKey(
        "remaining_replacement_longtail_hidden_draw_keep_or_top_replacement",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "hidden_draw_keep_or_top_replacement",
      extraDraw: 1,
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_rig",
      },
      {
        kind: "tactic_interpretation",
        signal: "draw.card",
        use: "draw.card",
      },
      {
        kind: "target_preference",
        purpose: "filter_stack_for_current_setup_need",
        preferences: [
          "missing_current_coverage",
          "central_or_remote_plan_enabler",
        ],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_157_crash-everett-inventive-fixer",
      setId: "originalset-v1",
      collectorNumber: "157",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
