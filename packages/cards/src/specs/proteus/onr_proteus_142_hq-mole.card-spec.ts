import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_142_hq-mole"),
    title: "HQ Mole",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[4], [T]: Access two additional cards from HQ. Use this ability only when accessing cards from HQ. Hidden resources are installed face down, but are put into the trash face up.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("hq_access_start_add_two_accesses"),
        actionLabel: "HQ Mole: zwei zusaetzliche HQ-Karten accessen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_142_hq-mole",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["hidden"],
      numeric: {
        installCost: 0,
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
        capabilityKey: capabilityKey("hq_access_start_add_two_accesses"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "access_start",
        costs: [
          {
            kind: "credit",
            amount: 4,
          },
          {
            kind: "trash_source",
            amount: 1,
          },
        ],
        condition: {
          kind: "current_run_server",
          server: "hq",
        },
        effects: [
          {
            kind: "add_current_run_access_count",
            server: "hq",
            amount: 2,
            visibility: "hidden_info_barrier",
          },
        ],
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
        role: "pressure_hq",
      },
      {
        kind: "strategic_role",
        role: "payoff_anchor",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.hq_pressure",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.interface_closeout",
      },
      {
        kind: "line_support",
        lineKey: "runner.hq_pressure",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "runner.interface_closeout",
        support: "supports",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("hq_access_start_add_two_accesses"),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "runner.hq_pressure",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_access_hq_multiaccess",
            evidenceAnchor: "access.hq_multiaccess",
            confidence: "medium",
          },
          {
            kind: "strategy_support",
            strategyKey: "runner.interface_closeout",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_access_hq_multiaccess",
            evidenceAnchor: "access.hq_multiaccess",
            confidence: "medium",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_142_hq-mole",
      setId: "proteus",
      collectorNumber: "P142",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
