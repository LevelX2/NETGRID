import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_110_hijack"),
    title: "Hijack",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Install a program or a piece of hardware. Gain [3], which you may use only to pay for its installation cost. Return to the bank any of the [3] you did not spend.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_110_hijack",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 1,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    runnerEventLongtail: {
      capabilityKey: capabilityKey(
        "install_grip_program_or_hardware_with_temp_credits",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "grip_install_program_or_hardware_with_temporary_credits",
      temporaryCredits: 3,
      allowedTypes: ["program", "hardware"],
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "recover_economy",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "target_preference",
        purpose: "install_best_legal_target",
        preferences: [
          "high_install_cost_or_memory",
          "central_or_remote_plan_enabler",
        ],
        avoid: ["hidden_info_dependent_choice"],
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "low",
        rationale:
          "Migrated from reviewed Proteus hint onr_proteus_110_hijack.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_110_hijack",
      setId: "proteus",
      collectorNumber: "P110",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
