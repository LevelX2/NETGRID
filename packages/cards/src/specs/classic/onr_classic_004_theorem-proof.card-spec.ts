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
      {
        source: "project_ruling",
        reference: "docs/source/Netrunner Errata 1.70.md#Theorem Proof",
        note: "If the Runner declines installation and Theorem Proof remains in the same fort until the start of the next Runner turn, the Runner scores it.",
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
      onDecline: {
        kind: "score_if_still_installed_in_same_fort_at_runner_start",
      },
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
        kind: "strategic_exchange",
        exchange: "score_progress",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
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
