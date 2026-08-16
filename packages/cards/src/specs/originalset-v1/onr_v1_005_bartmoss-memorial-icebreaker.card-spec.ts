import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_v1_005_bartmoss-memorial-icebreaker",
    ),
    title: "Bartmoss Memorial Icebreaker",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[1]: Break ice subroutine.\n[1]: +1 strength.\nAfter passing each piece of ice, roll a die if you used Bartmoss Memorial Icebreaker to break any subroutines of that ice. On a 1, trash Bartmoss Memorial Icebreaker.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_005_bartmoss-memorial-icebreaker",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["icebreaker", "random"],
      numeric: {
        installCost: 5,
        memoryCost: 1,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 0,
      },
    },
    icebreakerAbilities: [
      {
        capabilityKey: capabilityKey("icebreaker_abilities_break_subroutine"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "break_subroutine",
        cost: {
          kind: "credit",
          amount: 1,
        },
        matches: {
          kind: "any",
        },
        special: {
          kind: "bartmoss_post_encounter_self_trash_check",
        },
        visibility: "public",
      },
      {
        capabilityKey: capabilityKey("icebreaker_abilities_increase_strength"),
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
        kind: "strategic_role",
        role: "emergency_tool",
      },
      {
        kind: "tactic_interpretation",
        signal: "coverage.breaker",
        use: "coverage.breaker",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_005_bartmoss-memorial-icebreaker",
      setId: "originalset-v1",
      collectorNumber: "005",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
