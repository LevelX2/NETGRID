import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_001_data-fort-remapping"),
    title: "Data Fort Remapping",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put a Remap counter on Data Fort Remapping when you score it. Remap Counter: End a run.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("spend_remap_counter_end_run"),
        actionLabel: "Data Fort Remapping: Run beenden",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_001_data-fort-remapping",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["gray_ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 4,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey("on_score_add_remap_counter"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "add_counters_on_score",
      counterType: "remap",
      amount: 1,
      visibility: "public",
    },
    abilities: [
      {
        capabilityKey: capabilityKey("spend_remap_counter_end_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_during_run",
        costs: [
          {
            kind: "source_counter",
            counterType: "remap",
            amount: 1,
            source: "source",
          },
        ],
        effects: [
          {
            kind: "end_run",
            successful: false,
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
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "run_end_score_window_protection",
        confidence: "medium",
        rationale:
          "Agenda Semantic Review v1 maps Data Fort Remapping to corp.remote_scoring as defensive_tool/run_end_score_window_protection.",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "low",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_001_data-fort-remapping",
      setId: "classic",
      collectorNumber: "C001",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
