import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_156_corporate-ally"),
    title: "Corporate Ally",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Installing Corporate Ally costs 1 agenda point, in addition to the normal cost. The difficulty of all agendas is +1.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_156_corporate-ally",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["connection", "unique"],
      numeric: {
        installCost: 3,
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
    unique: {
      kind: "unique_by_title",
      controller: "runner",
    },
    installAdditionalCosts: [
      {
        kind: "agenda_point",
        amount: 1,
      },
    ],
    modifiers: [
      {
        kind: "agenda_difficulty",
        operation: "increase",
        amount: 1,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        side: "corp",
        visibility: "public",
        appliesTo: {
          cardType: "agenda",
        },
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
        role: "contest_remote",
      },
      {
        kind: "strategic_role",
        role: "scoring_tool",
      },
      {
        kind: "line_support",
        lineKey: "runner.remote_contest",
        support: "supports",
      },
      {
        kind: "strategic_exchange",
        exchange: "score_progress",
      },
      {
        kind: "strategic_exchange",
        exchange: "board_or_hand_sacrifice",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_156_corporate-ally",
      setId: "originalset-v1",
      collectorNumber: "156",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
