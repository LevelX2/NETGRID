import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_167_leland-corporate-bodyguard"),
    title: "Leland, Corporate Bodyguard",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "[1]: Prevent 1 meat damage. [T]: Avoid receiving a tag.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_167_leland-corporate-bodyguard",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
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
    damagePreventionSources: [
      {
        capabilityKey: capabilityKey(
          "damage_prevention_sources_damage_prevention",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage_prevention",
        damageTypes: ["meat"],
        amount: 1,
        cost: {
          kind: "credit",
          amount: 1,
        },
        priority: 118,
        visibility: "public",
      },
    ],
    tagPreventionSources: [
      {
        capabilityKey: capabilityKey("tag_prevention_sources_avoid_tag"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "avoid_tag",
        amount: 1,
        cost: {
          kind: "trash_source",
        },
        priority: 122,
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
        role: "survive_damage",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_167_leland-corporate-bodyguard",
      setId: "originalset-v1",
      collectorNumber: "167",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
