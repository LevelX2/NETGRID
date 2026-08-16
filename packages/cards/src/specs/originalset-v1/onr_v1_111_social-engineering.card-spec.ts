import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_111_social-engineering"),
    title: "Social Engineering",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Hide at least 2 from your pool in your hand; the Corp then guesses how many bits you hid. If the Corp guesses correctly, lose that many bits. Otherwise, choose a data fort and a piece of ice on that fort. Then make a run on that fort, during which you automatically pass that piece of ice.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_111_social-engineering",
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
        credits: 1,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    hiddenReplacementLongtail: {
      capabilityKey: capabilityKey(
        "hidden_replacement_longtail_secret_spend_guess_then_targeted_bypass_run",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "secret_spend_guess_then_targeted_bypass_run",
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "run_pressure",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.run_event_tempo",
      },
      {
        kind: "risk_interpretation",
        risk: "credit_reserve_cost",
        severity: "high",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "hidden_replacement_longtail_secret_spend_guess_then_targeted_bypass_run",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "bypass_chosen_ice",
            preferences: [
              "known_or_rezzed_ice",
              "blocks_relevant_run_path",
              "high_break_cost_without_bonus",
            ],
            avoid: ["insufficient_post_payment_reserve"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_111_social-engineering",
      setId: "originalset-v1",
      collectorNumber: "111",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
