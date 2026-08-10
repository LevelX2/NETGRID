import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_039_library-search"),
    title: "Library Search",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Make a run on R&D or HQ. If run is successful, access two additional cards if you used no noisy icebreakers during the run and if no trace attempts were made during the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_039_library-search",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 2,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    runnerEventLongtail: {
      capabilityKey: capabilityKey("run_rd_or_hq_with_access_bonus"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "library_search_run",
      accessBonus: 2,
      allowedServers: ["rd", "hq"],
      condition: "no_noisy_icebreaker_or_trace",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "pressure_hq",
      },
      {
        kind: "plan_role",
        role: "pressure_rnd",
      },
      {
        kind: "strategic_role",
        role: "payoff_anchor",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.hq_pressure",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.interface_closeout",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.rnd_pressure",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.run_event_tempo",
      },
      {
        kind: "line_support",
        lineKey: "runner.hq_pressure",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "runner.interface_closeout",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "runner.rnd_pressure",
        support: "supports",
      },
      {
        kind: "target_preference",
        purpose: "choose_hq_or_rnd_for_conditional_multiaccess_run",
        preferences: [
          "protects_central_access_pressure",
          "current_run_path_relevance",
        ],
        avoid: ["hidden_info_dependent_choice"],
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("run_rd_or_hq_with_access_bonus"),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "runner.hq_pressure",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_access_hq_multiaccess",
            evidenceAnchor: "access.hq_multiaccess",
            confidence: "high",
          },
          {
            kind: "strategy_support",
            strategyKey: "runner.interface_closeout",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_access_hq_multiaccess",
            evidenceAnchor: "access.hq_multiaccess",
            confidence: "high",
          },
          {
            kind: "strategy_support",
            strategyKey: "runner.interface_closeout",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_access_rnd_multiaccess",
            evidenceAnchor: "access.rnd_multiaccess",
            confidence: "high",
          },
          {
            kind: "strategy_support",
            strategyKey: "runner.rnd_pressure",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_access_rnd_multiaccess",
            evidenceAnchor: "access.rnd_multiaccess",
            confidence: "high",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_039_library-search",
      setId: "classic",
      collectorNumber: "C039",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
