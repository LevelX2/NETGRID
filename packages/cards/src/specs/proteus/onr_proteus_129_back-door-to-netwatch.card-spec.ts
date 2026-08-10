import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_129_back-door-to-netwatch"),
    title: "Back Door to Netwatch",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[3], [T]: Cancel the effect of a successful trace. Give the Corp 1 Bad Publicity point if the trace would have had an effect other than or in addition to giving you any tags. Hidden resources are installed face down, but are put into the trash face up. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("trace_success_cancel_window"),
        actionLabel: "Back Door to Netwatch: Trace-Effekt canceln",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_129_back-door-to-netwatch",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["bad_publicity", "hidden"],
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
        capabilityKey: capabilityKey("trace_success_cancel_window"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "trace_success_cancel_window",
        costs: [
          {
            kind: "credit",
            amount: 3,
          },
          {
            kind: "trash_source",
            amount: 1,
          },
        ],
        effects: [],
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
        kind: "tactic_interpretation",
        signal: "punish.payoff",
        use: "punish.payoff",
      },
      {
        kind: "tactic_interpretation",
        signal: "tag.payoff",
        use: "tag.payoff",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("trace_success_cancel_window"),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_tag_payoff",
            evidenceAnchor: "tag.payoff",
            confidence: "medium",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_129_back-door-to-netwatch",
      setId: "proteus",
      collectorNumber: "P129",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
