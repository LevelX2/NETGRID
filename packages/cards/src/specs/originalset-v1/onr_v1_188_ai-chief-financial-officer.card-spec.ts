import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_188_ai-chief-financial-officer"),
    title: "AI Chief Financial Officer",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[A]: Shuffle cards stored in HQ and the Archives into R&D; then draw five cards.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_188_ai-chief-financial-officer",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["asset"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 5,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "scored_agenda_shuffle_hq_archives_into_rd_then_draw",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "shuffle_hq_archives_into_rd_then_draw",
      drawCount: 5,
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "score_now",
      },
      {
        kind: "plan_role",
        role: "score_next_turn",
      },
      {
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "line_support",
        lineKey: "corp.deck_recycle_engine",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.deck_recycle_engine",
        role: "engine_anchor",
        roleDetail: "scored_zone_recycle_draw_engine",
        confidence: "medium",
        rationale:
          "Action draw plus HQ/Archives-to-R&D shuffle forms a reusable deck recycle engine after scoring.",
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
      printingId: "onr_v1_188_ai-chief-financial-officer",
      setId: "originalset-v1",
      collectorNumber: "188",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
