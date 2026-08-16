import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_057_doppelganger-antibody"),
    title: "Doppelganger Antibody",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "When Runner accesses Doppelganger Antibody, you may pay [2] to give Runner a Doppelganger counter, even if Doppelganger is not installed. Ignore this effect if Runner accesses Doppelganger from the Archives. Each Doppelganger counter causes Runner to lose [1] at the start of each of his or her turns. Runner may take an action to pay [4] to remove a Doppelganger counter. If Doppelganger is accessed from R&D, Runner must show it to you.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_057_doppelganger-antibody",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["ambush", "node", "virus"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 0,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    accessEffects: [
      {
        capabilityKey: capabilityKey("access_add_doppelganger_counter"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed", "hq", "rd", "archives"],
        ignoreIfAccessedFrom: ["archives"],
        revealIfAccessedFrom: ["rd"],
        cost: {
          kind: "corp_may_pay_credits",
          amount: 2,
        },
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "add_runner_counter",
            counterType: "doppelganger",
            amount: 1,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
    runnerCounterEffects: [
      {
        capabilityKey: capabilityKey(
          "doppelganger_counter_start_turn_credit_loss",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        counterType: "doppelganger",
        removeCost: 4,
        startOfRunnerTurn: {
          kind: "lose_credits",
          amountPerCounter: 1,
          visibility: "public",
        },
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
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ambush_bluff",
      },
      {
        kind: "line_support",
        lineKey: "corp.ambush_bluff",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ambush_bluff",
        role: "punish_payoff",
        roleDetail: "access_counter_credit_loss",
        evidenceProfile: "access_counter_credit_loss",
        confidence: "medium",
        rationale:
          "Counter-Punish konkret als Runner-Credit-Loss-Counter. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
      },
      {
        kind: "tactic_interpretation",
        signal: "access.punish",
        use: "access.punish",
      },
      {
        kind: "tactic_interpretation",
        signal: "punish.payoff",
        use: "punish.payoff",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_057_doppelganger-antibody",
      setId: "proteus",
      collectorNumber: "P057",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
