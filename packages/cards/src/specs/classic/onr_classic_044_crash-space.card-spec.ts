import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_044_crash-space"),
    title: "Crash Space",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Gain [1] at the start of each of your turns. All trace attempts are automatically successful, and give you a tag in addition to their other effects. If Crash Space leaves play, lose [2]. A: Trash Crash Space. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("trash_source_action"),
        actionLabel: "Crash Space trashen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_044_crash-space",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["unique"],
      numeric: {
        installCost: 2,
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
    lifecycle: {
      start_of_runner_turn: [
        {
          effects: [
            {
              kind: "gain_credits",
              recipient: "runner",
              amount: 1,
              visibility: "public",
            },
          ],
        },
      ],
      on_leave_play: [
        {
          kind: "lose_credits",
          recipient: "runner",
          amount: 2,
          visibility: "public",
        },
      ],
    },
    abilities: [
      {
        capabilityKey: capabilityKey("trash_source_action"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "trash_source",
            visibility: "public",
          },
        ],
      },
    ],
    runnerUtilityLongtail: {
      capabilityKey: capabilityKey("trace_auto_success_add_tag"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "trace_attempts_auto_success_add_tag",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "find_economy",
      },
      {
        kind: "strategic_role",
        role: "support_tool",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("trace_auto_success_add_tag"),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "anchor_evidence",
            roleDetail: "anchor_evidence_tag_source",
            evidenceAnchor: "tag.source",
            confidence: "medium",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_044_crash-space",
      setId: "classic",
      collectorNumber: "C044",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
