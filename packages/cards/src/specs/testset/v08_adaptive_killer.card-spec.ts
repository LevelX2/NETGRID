import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("v08_adaptive_killer"),
    title: "Adaptive Killer",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "1 Credit: +1 Stärke. 1 Credit: Brich 1 Sentry-Subroutine.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "v08_adaptive_killer",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "neutral_demo",
      subtypes: ["icebreaker", "killer"],
      numeric: {
        installCost: 4,
        memoryCost: 1,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 3,
      },
    },
    icebreakerAbilities: [
      {
        capabilityKey: capabilityKey("v08_adaptive_killer_pump"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "increase_strength",
        cost: {
          kind: "credit",
          amount: 1,
        },
        amount: 1,
        duration: "current_encounter",
        visibility: "public",
      },
      {
        capabilityKey: capabilityKey("v08_adaptive_killer_break_sentry"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "break_subroutine",
        cost: {
          kind: "credit",
          amount: 1,
        },
        matches: {
          kind: "ice_subtype",
          subtype: "sentry",
        },
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
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "v08_adaptive_killer",
      setId: "testset",
      collectorNumber: "V08-007",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
