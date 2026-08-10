import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_115_personal-touch-the"),
    title: "Personal Touch, The",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Put a +1 strength counter on an icebreaker.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_115_personal-touch-the",
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
        credits: 4,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    runnerEventTargetedEffect: {
      capabilityKey: capabilityKey("add_power_counter_to_installed_breaker"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "add_strength_counter_to_installed_icebreaker",
      counterType: "power",
      amount: 1,
      visibility: "public",
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
        kind: "strategic_role",
        role: "support_tool",
      },
      {
        kind: "tactic_interpretation",
        signal: "coverage.breaker",
        use: "coverage.breaker",
      },
      {
        kind: "target_preference",
        purpose: "permanent_strength_counter",
        preferences: [
          "installed_icebreaker",
          "high_break_cost_without_bonus",
          "breaker_matching_common_problem_ice",
        ],
        avoid: ["already_cheap_to_break"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_115_personal-touch-the",
      setId: "proteus",
      collectorNumber: "P115",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
