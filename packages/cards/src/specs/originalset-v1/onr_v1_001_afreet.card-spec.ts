import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_001_afreet"),
    title: "Afreet",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Afreet can host up to 3 MU of programs. Hosted programs use Afreet's hosting capacity instead of Runner MU.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_001_afreet",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["daemon"],
      numeric: {
        installCost: 2,
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
      capacityMu: 3,
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
        kind: "plan_role",
        role: "safe_probe_run",
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
      printingId: "onr_v1_001_afreet",
      setId: "originalset-v1",
      collectorNumber: "001",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
