import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_090_highlighter"),
    title: "Highlighter",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "After each successful run on R&D, give the Corp a Highlighter counter. Each Highlighter counter after the first allows you to access an additional card from R&D whenever you access cards from R&D. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_090_highlighter",
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
      capabilityKey: capabilityKey("rd_success_add_highlighter_access_counter"),
      addressability: ["plan", "action", "quote", "debug"],
      counterKind: "highlighter",
      addOnSuccessfulRun: {
        server: "rd",
        counterScope: { kind: "shared_corp_pool" },
        amount: 1,
        visibility: "public",
      },
      centralAccessCountModifier: {
        source: "corp_purgeable_runner_virus_counter",
        counterKind: "highlighter",
        server: "rd",
        formula: "per_counter_after_first",
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
        strategyKey: "runner.interface_closeout",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.rnd_pressure",
      },
      {
        kind: "line_support",
        lineKey: "runner.rnd_pressure",
        support: "supports",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "rd_success_add_highlighter_access_counter",
        ),
        annotations: [
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
      printingId: "onr_proteus_090_highlighter",
      setId: "proteus",
      collectorNumber: "P090",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
