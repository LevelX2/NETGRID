import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_117_valu-pak-software-bundle"),
    title: "Valu-Pak Software Bundle",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Gain up to five consecutive actions, which you may use only to install programs, and gain [1]. If you do not spend the bit during these actions, return it to the bank afterwards.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_117_valu-pak-software-bundle",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
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
        credits: 0,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_on_play_start_runner_program_install_action_bundle",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "start_runner_program_install_action_bundle",
            actionCount: 5,
            temporaryCredit: 1,
            allowedActionKind: "install_program",
            mayStopEarly: true,
            visibility: "public",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      { kind: "plan_role", role: "runner_action_bundle" },
      { kind: "plan_role", role: "rig_development" },
      {
        kind: "target_preference",
        purpose: "program_install_bundle",
        preferences: [
          "program_affordable_after_install",
          "program_repairs_missing_coverage",
          "program_preserves_run_goal",
          "low_mu_program",
        ],
        avoid: ["target_would_break_host_limit", "low_value_program"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_117_valu-pak-software-bundle",
      setId: "originalset-v1",
      collectorNumber: "117",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
