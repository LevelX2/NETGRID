import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_004_theorem-proof"),
    title: "Theorem Proof",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      'If Runner accesses Theorem Proof, he or she does not score it, but instead may install it as a 2 MU program that has the ability "A: Score Theorem Proof" but is removed from the game if it leaves play in any other way.',
    capabilityText: [
      {
        capabilityKey: capabilityKey("score_source_as_agenda"),
        actionLabel: "Theorem Proof scoren",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_004_theorem-proof",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["research"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 5,
        agendaPoints: 3,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    agendaAccessReplacement: {
      capabilityKey: capabilityKey("access_install_as_runner_program"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "install_as_runner_program",
      memoryCost: 2,
      scoreAsAgendaAction: true,
      removeFromGameOnLeavePlay: true,
      visibility: "public",
    },
    abilities: [
      {
        capabilityKey: capabilityKey("score_source_as_agenda"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "score_source_as_agenda",
            visibility: "public",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.remote_scoring",
      },
      {
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "agenda_steal_friction_tool",
        confidence: "medium",
        rationale:
          "Agenda Semantic Review v1 maps Theorem Proof to corp.remote_scoring as defensive_tool/agenda_steal_friction_tool.",
      },
      {
        kind: "target_preference",
        purpose: "install_theorem_proof_as_runner_program",
        preferences: ["current_access_only"],
        avoid: ["hidden_info_dependent_choice"],
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_004_theorem-proof.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_004_theorem-proof.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_004_theorem-proof",
      setId: "classic",
      collectorNumber: "C004",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
