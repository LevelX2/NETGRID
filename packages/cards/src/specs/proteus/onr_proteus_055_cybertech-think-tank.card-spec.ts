import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_055_cybertech-think-tank"),
    title: "Cybertech Think Tank",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may advance Cybertech Think Tank before and after you rez it. Cybertech Think Tank advancement counter: Increase by 1 the meat damage dealt by another source.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_055_cybertech-think-tank",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["asset", "node"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 1,
        trashCost: 3,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    advanceable: {
      while: "installed_before_and_after_rez",
    },
    corpUtility: {
      capabilityKey: capabilityKey("successful_meat_damage_boost"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "meat_damage_boost",
      cost: {
        kind: "advancement_counter",
        amount: 1,
      },
      amount: 1,
      timing: "successful_meat_damage",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "line_support",
        lineKey: "corp.damage_kill",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.damage_kill",
        role: "enabler",
        roleDetail: "damage_amplifier",
        evidenceProfile: "damage_amplifier",
        confidence: "high",
        rationale:
          "Advancement counters increase another meat damage source; not a direct damage payoff itself.",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
        rationale:
          "Migrated from reviewed Proteus hint onr_proteus_055_cybertech-think-tank.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_055_cybertech-think-tank",
      setId: "proteus",
      collectorNumber: "P055",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
