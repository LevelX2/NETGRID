import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_v1_187_wilson-weeflerunner-apprentice",
    ),
    title: "Wilson, Weeflerunner Apprentice",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Each of your turns, you may choose to gain an action, which you may use only to make a run. You cannot spend more than [3] during that run to pay for using icebreakers or increasing your link. Use this ability only once per turn and only during your turn.\n[T]: Avoid receiving a tag.\n[T]: Prevent any amount of meat damage.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_187_wilson-weeflerunner-apprentice",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
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
    remainingReplacementLongtail: {
      capabilityKey: capabilityKey(
        "remaining_replacement_longtail_run_action_spending_cap",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "run_action_spending_cap",
      actionGain: 1,
      spendingCap: 3,
      appliesTo: ["icebreaker_use", "increase_link"],
      visibility: "public",
    },
    tagPreventionSources: [
      {
        capabilityKey: capabilityKey("tag_prevention_sources_avoid_tag"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "avoid_tag",
        amount: 1,
        cost: {
          kind: "trash_source",
        },
        priority: 130,
        visibility: "public",
      },
    ],
    damagePreventionSources: [
      {
        capabilityKey: capabilityKey(
          "damage_prevention_sources_damage_prevention",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage_prevention",
        damageTypes: ["meat"],
        amount: "all",
        cost: {
          kind: "trash_source",
        },
        priority: 130,
        visibility: "public",
      },
    ],
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
        kind: "plan_role",
        role: "avoid_tags",
      },
      {
        kind: "plan_role",
        role: "survive_meat_damage",
      },
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "line_support",
        lineKey: "runner.survival_defense",
        support: "supports",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_187_wilson-weeflerunner-apprentice",
      setId: "originalset-v1",
      collectorNumber: "187",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
