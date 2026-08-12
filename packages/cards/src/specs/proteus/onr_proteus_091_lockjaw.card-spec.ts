import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_091_lockjaw"),
    title: "Lockjaw",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: Give one of your icebreakers +2 strength for the remainder of this run. Use this ability only during an encounter with a piece of ice.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_091_lockjaw",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
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
    runnerRunStrengthBoost: {
      capabilityKey: capabilityKey("trash_source_boost_breaker_two_for_run"),
      addressability: ["plan", "action", "quote", "debug"],
      timing: "during_ice_encounter",
      cost: {
        trashSelf: true,
      },
      target: "installed_runner_icebreaker",
      amount: 2,
      duration: "current_run",
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
        kind: "plan_role",
        role: "safe_probe_run",
      },
      {
        kind: "target_preference",
        purpose: "temporary_strength_bonus",
        preferences: [
          "installed_icebreaker",
          "currently_used_breaker",
          "breaker_matching_current_ice",
        ],
        avoid: ["low_value_program", "already_cheap_to_break"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_091_lockjaw",
      setId: "proteus",
      collectorNumber: "P091",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
