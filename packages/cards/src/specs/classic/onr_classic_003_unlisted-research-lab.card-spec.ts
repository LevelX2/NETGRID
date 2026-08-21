import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_003_unlisted-research-lab"),
    title: "Unlisted Research Lab",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Draw an additional card at the start of each of your turns.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_003_unlisted-research-lab",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["asset", "gray_ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 3,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey("on_score_start_turn_extra_draw"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "corp_start_turn_mandatory_draw",
      drawCount: 1,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.draw_engine",
      },
      {
        kind: "line_support",
        lineKey: "corp.draw_engine",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.draw_engine",
        role: "engine_anchor",
        roleDetail: "scored_recurring_draw_engine",
        confidence: "high",
        rationale:
          "Scored recurring draw is a repeatable Corp draw engine, not generic remote-scoring support.",
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
      printingId: "onr_classic_003_unlisted-research-lab",
      setId: "classic",
      collectorNumber: "C003",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
