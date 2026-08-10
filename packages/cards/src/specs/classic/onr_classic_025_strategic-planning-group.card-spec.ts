import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_classic_025_strategic-planning-group",
    ),
    title: "Strategic Planning Group",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever you draw one or more cards, draw an extra card. Then place one of the drawn cards on the bottom of R&D. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_025_strategic-planning-group",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["node", "unique"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 2,
        trashCost: 4,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    unique: {
      kind: "unique_by_title",
      controller: "corp",
    },
    corpUtility: {
      capabilityKey: capabilityKey("start_turn_draw_extra_then_bottom_one"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "corp_draw_extra_then_bottom_one",
      extraDraw: 1,
      bottom: "one_drawn_card",
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "strategic_role",
        role: "engine_anchor",
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
        roleDetail: "recurring_draw_filter_engine",
        confidence: "high",
        rationale:
          "Recurring extra draw plus controller-only bottom-deck filtering is a draw/filter engine, not central stabilization; trigger is not limited to start-of-turn draw.",
      },
      {
        kind: "tactic_interpretation",
        signal: "draw.card",
        use: "draw.card",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_025_strategic-planning-group",
      setId: "classic",
      collectorNumber: "C025",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
