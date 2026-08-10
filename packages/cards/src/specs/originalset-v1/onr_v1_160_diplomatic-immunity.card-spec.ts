import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_160_diplomatic-immunity"),
    title: "Diplomatic Immunity",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Prevents all meat damage. The Corp may pay 1 agenda point to cancel this effect until end of turn. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_160_diplomatic-immunity",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["unique"],
      numeric: {
        installCost: 1,
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
        corpMayCancelUntilEndOfTurn: {
          agendaPointCost: 1,
        },
        priority: 140,
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "survive_meat_damage",
      },
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.survival_defense",
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
      printingId: "onr_v1_160_diplomatic-immunity",
      setId: "originalset-v1",
      collectorNumber: "160",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
