import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_085_executive-wiretaps"),
    title: "Executive Wiretaps",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Make a run on HQ. If successful, access two additional cards from HQ.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_085_executive-wiretaps",
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
        credits: 2,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("abilities_on_play_make_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "make_run",
            target: {
              kind: "central_server",
              server: "hq",
            },
            accessCount: 3,
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
        kind: "strategy_anchor",
        strategyKey: "runner.run_event_tempo",
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
        capabilityKey: capabilityKey("abilities_on_play_make_run"),
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
      printingId: "onr_v1_085_executive-wiretaps",
      setId: "originalset-v1",
      collectorNumber: "085",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
