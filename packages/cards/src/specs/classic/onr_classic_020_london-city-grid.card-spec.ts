import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_020_london-city-grid"),
    title: "London City Grid",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Runner must pay [1], in addition to the normal cost, to use each subroutine of a noisy icebreaker during runs on this fort. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_020_london-city-grid",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["region"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 3,
        trashCost: 6,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    modifiers: [
      {
        kind: "break_ability_use_cost",
        operation: "increase",
        amount: 1,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        side: "corp",
        visibility: "public",
        appliesTo: {
          cardType: "ice",
        },
        appliesToRunner: {
          cardType: "program",
          subtype: "noisy",
        },
        sameServerAsSource: true,
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_020_london-city-grid",
      setId: "classic",
      collectorNumber: "C020",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
