import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_172_quest-for-cattekin"),
    title: "Quest for Cattekin",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "At the start of each of your turns, roll a die. On a 6, trash Quest for Cattekin and you gain an action on each of your turns for the remainder of the game. On a 1, suffer 1 brain damage. On a 2, suffer 1 Net damage. Damage from Quest for Cattekin cannot be prevented.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_172_quest-for-cattekin",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["random"],
      numeric: {
        installCost: 4,
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
    runnerUtilityLongtail: {
      capabilityKey: capabilityKey(
        "runner_utility_longtail_start_turn_random_effect_table",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "start_turn_random_effect_table",
      dieFaces: 6,
      randomPurpose: "runner_start_turn_source",
      outcomes: [
        {
          roll: 6,
          kind: "trash_source_and_grant_persistent_extra_action",
          extraActions: 1,
        },
        {
          roll: 1,
          kind: "unpreventable_damage",
          damageType: "core",
          amount: 1,
        },
        {
          roll: 2,
          kind: "unpreventable_damage",
          damageType: "net",
          amount: 1,
        },
      ],
      defaultOutcome: {
        kind: "no_effect",
      },
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "random_persistent_action_capacity",
      },
      {
        kind: "risk_interpretation",
        risk: "random_unpreventable_core_or_net_damage",
        severity: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_172_quest-for-cattekin",
      setId: "originalset-v1",
      collectorNumber: "172",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
