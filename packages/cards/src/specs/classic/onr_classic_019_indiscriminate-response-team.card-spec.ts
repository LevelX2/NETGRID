import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_classic_019_indiscriminate-response-team",
    ),
    title: "Indiscriminate Response Team",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "After Runner makes a successful run, you may have Runner shuffle his or her hand into his or her stack and then draw as many cards as he or she had before.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_019_indiscriminate-response-team",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["node", "black_ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 2,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    successfulRunFollowups: [
      {
        capabilityKey: capabilityKey("successful_run_shuffle_grip_then_redraw"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count",
        timing: "after_successful_run",
        cost: "none",
        visibility: "hidden_info_barrier",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "runner_hand_disruption",
      },
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.central_stabilize",
      },
      {
        kind: "line_support",
        lineKey: "corp.central_stabilize",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.central_stabilize",
        role: "defensive_tool",
        roleDetail: "successful_run_grip_reset_defense",
        confidence: "medium",
        rationale:
          "Nach erfolgreichem Run stört der Asset-Trigger Runner-Handqualität und Folgeruns, ohne Access-Ambush- oder Hidden-Info-Leak zu sein.",
      },
      {
        kind: "tactic_interpretation",
        signal: "punish.payoff",
        use: "punish.payoff",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_019_indiscriminate-response-team",
      setId: "classic",
      collectorNumber: "C019",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
