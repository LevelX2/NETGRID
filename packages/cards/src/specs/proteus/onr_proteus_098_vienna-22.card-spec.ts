import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_098_vienna-22"),
    title: "Vienna 22",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "After each successful run on HQ, give the Corp a Vienna counter. Each Vienna counter allows you to access an additional card from HQ whenever you access cards from HQ. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_098_vienna-22",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["virus"],
      numeric: {
        installCost: 3,
        memoryCost: 1,
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
    virusCounter: {
      capabilityKey: capabilityKey("hq_success_add_vienna_access_counter"),
      addressability: ["plan", "action", "quote", "debug"],
      counterKind: "vienna",
      addOnSuccessfulRun: {
        server: "hq",
        counterScope: { kind: "shared_corp_pool" },
        amount: 1,
        visibility: "public",
      },
      centralAccessCountModifier: {
        source: "corp_purgeable_runner_virus_counter",
        counterKind: "vienna",
        server: "hq",
        formula: "per_counter",
        visibility: "public",
      },
    },
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
        kind: "line_support",
        lineKey: "runner.hq_pressure",
        support: "supports",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("hq_success_add_vienna_access_counter"),
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
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_098_vienna-22",
      setId: "proteus",
      collectorNumber: "P098",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
