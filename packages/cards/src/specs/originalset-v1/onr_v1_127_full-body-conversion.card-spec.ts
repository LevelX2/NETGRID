import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_127_full-body-conversion"),
    title: "Full Body Conversion",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Prevents all meat damage. For each 1 credit the Corp pays when meat damage is done, 1 meat damage is not prevented.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_127_full-body-conversion",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["cybernetics"],
      numeric: {
        installCost: 0,
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
          kind: "none",
        },
        corpMayPayToBypass: {
          costPerDamage: 1,
        },
        priority: 119,
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
      printingId: "onr_v1_127_full-body-conversion",
      setId: "originalset-v1",
      collectorNumber: "127",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
