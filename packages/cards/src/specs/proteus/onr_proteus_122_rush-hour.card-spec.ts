import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_122_rush-hour"),
    title: "Rush Hour",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Make a run on R&D. If run is successful, access three additional cards from R&D. You cannot use noisy icebreakers during the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_122_rush-hour",
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
        credits: 3,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "on_play_rd_run_access_four_without_noisy_breakers",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "make_run",
            target: {
              kind: "central_server",
              server: "rd",
            },
            accessCount: 4,
            prohibitNoisyIcebreakers: true,
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
        role: "pressure_rnd",
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
        kind: "strategy_anchor",
        strategyKey: "runner.run_event_tempo",
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
        capabilityKey: capabilityKey(
          "on_play_rd_run_access_four_without_noisy_breakers",
        ),
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
      printingId: "onr_proteus_122_rush-hour",
      setId: "proteus",
      collectorNumber: "P122",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
