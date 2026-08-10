import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_068_pattel-antibody"),
    title: "Pattel Antibody",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "When Runner accesses Pattel Antibody, you may pay [3] to put a Pattel counter on all installed icebreakers, even if Pattel Antibody is not installed. Ignore this effect if Runner accesses Pattel Antibody from the Archives. Each Pattel counter on an icebreaker reduces its strength by 1. If Pattel Antibody is accessed from R&D, Runner must show it to you.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_068_pattel-antibody",
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
        capabilityKey: capabilityKey(
          "access_add_breaker_strength_penalty_counters",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed", "hq", "rd", "archives"],
        ignoreIfAccessedFrom: ["archives"],
        revealIfAccessedFrom: ["rd"],
        cost: {
          kind: "corp_may_pay_credits",
          amount: 3,
        },
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "add_counter_to_all_installed_runner_icebreakers",
            counterType: "breaker_strength_penalty",
            amount: 1,
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
        roleDetail: "access_counter_icebreaker_strength",
        evidenceProfile: "access_counter_icebreaker_strength",
        confidence: "medium",
        rationale:
          "Counter-Punish konkret als Icebreaker-Strength-Counter. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
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
        rationale:
          "Migrated from reviewed Proteus hint onr_proteus_068_pattel-antibody.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_068_pattel-antibody",
      setId: "proteus",
      collectorNumber: "P068",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
