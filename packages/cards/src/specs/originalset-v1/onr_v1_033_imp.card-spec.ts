import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_033_imp"),
    title: "Imp",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Imp can have up to 2 MU of programs installed in it. All icebreakers installed in this way have their strength reduced by 1. If IMP leaves play, trash all programs installed in it.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_033_imp",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["daemon"],
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
    hostedProgramCapacity: {
      capacityMu: 2,
      allowedCardTypes: ["program"],
      hostedProgramsAreInstalled: true,
      hostLeavesPlayTrashesHosted: true,
    },
    hostedProgramModifiers: [
      {
        appliesTo: "hosted_icebreakers",
        kind: "icebreaker_strength",
        operation: "reduce",
        amount: 1,
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
        kind: "target_preference",
        purpose: "choose_hosted_program",
        preferences: ["low_mu_program"],
        avoid: ["target_would_break_host_limit"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_033_imp",
      setId: "originalset-v1",
      collectorNumber: "033",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
