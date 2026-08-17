import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_190_bioweapons-engineering"),
    title: "Bioweapons Engineering",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Each source of meat damage inflicts +1 meat damage.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_190_bioweapons-engineering",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["research"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 4,
        agendaPoints: 3,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey("scored_agenda_meat_damage_bonus"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "meat_damage_bonus",
      amount: 1,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
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
        kind: "strategy_anchor",
        strategyKey: "corp.damage_kill",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.damage_kill",
        role: "enabler",
        roleDetail: "meat_damage_amp_anchor",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Bioweapons Engineering to corp.damage_kill as enabler/meat_damage_amp_anchor.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_190_bioweapons-engineering",
      setId: "originalset-v1",
      collectorNumber: "190",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
