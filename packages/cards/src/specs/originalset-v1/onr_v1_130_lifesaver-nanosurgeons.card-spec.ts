import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_130_lifesaver-nanosurgeons"),
    title: "Lifesaver™ Nanosurgeons",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "A: Draw two cards. Use this ability only if you were damaged during any of your last three actions.\n[T]: Prevent 1 brain damage.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_draw_cards",
        ),
        actionLabel: "Lifesaver™ Nanosurgeons: 2 Karten ziehen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_130_lifesaver-nanosurgeons",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["cybernetics"],
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
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_draw_cards",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        condition: {
          kind: "runner_damaged_during_last_three_actions",
        },
        effects: [
          {
            kind: "draw_cards",
            recipient: "runner",
            amount: 2,
            visibility: "public",
          },
        ],
      },
    ],
    damagePreventionSources: [
      {
        capabilityKey: capabilityKey(
          "damage_prevention_sources_damage_prevention",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage_prevention",
        damageTypes: ["core"],
        amount: 1,
        cost: {
          kind: "trash_source",
        },
        priority: 121,
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
        role: "survive_core_damage",
      },
      {
        kind: "plan_role",
        role: "recover_cards",
      },
      {
        kind: "tactic_interpretation",
        signal: "draw.card",
        use: "draw.card",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_130_lifesaver-nanosurgeons",
      setId: "originalset-v1",
      collectorNumber: "130",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
