import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_147_r-and-d-mole"),
    title: "R&D Mole",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[4], [T]: Access two additional cards from R&D. Use this ability only when accessing cards from R&D. Hidden resources are installed face down, but are put into the trash face up.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("rd_access_start_add_two_accesses"),
        actionLabel: "R&D Mole: zwei zusaetzliche R&D-Karten accessen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_147_r-and-d-mole",
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
        capabilityKey: capabilityKey("rd_access_start_add_two_accesses"),
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
          server: "rd",
        },
        effects: [
          {
            kind: "add_current_run_access_count",
            server: "rd",
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
        role: "safe_probe_run",
      },
      {
        kind: "strategic_role",
        role: "payoff_anchor",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.interface_closeout",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.rnd_pressure",
      },
      {
        kind: "line_support",
        lineKey: "runner.interface_closeout",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "runner.rnd_pressure",
        support: "supports",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("rd_access_start_add_two_accesses"),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "runner.interface_closeout",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_access_rnd_multiaccess",
            evidenceAnchor: "access.rnd_multiaccess",
            confidence: "medium",
          },
          {
            kind: "strategy_support",
            strategyKey: "runner.rnd_pressure",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_access_rnd_multiaccess",
            evidenceAnchor: "access.rnd_multiaccess",
            confidence: "medium",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_147_r-and-d-mole",
      setId: "proteus",
      collectorNumber: "P147",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
