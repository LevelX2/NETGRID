import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_334_pacifica-regional-ai"),
    title: "Pacifica Regional AI",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may advance Pacifica Regional AI before and after you rez it.\nRegional AI advancement counter: Gain an action. Use this ability only during your turn.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_gain_actions",
        ),
        actionLabel:
          "Pacifica Regional AI: Advancement-Counter für Aktion ausgeben",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_334_pacifica-regional-ai",
      },
      {
        source: "project_ruling",
        reference: "docs/source/Netrunner Errata 1.70.md#Pacifica Regional AI",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ai"],
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
    advanceable: {
      while: "installed_before_and_after_rez",
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_gain_actions",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "advancement_counter",
            amount: 1,
            source: "source",
          },
        ],
        condition: {
          kind: "source_has_advancement_counters",
          minimum: 1,
        },
        effects: [
          {
            kind: "gain_actions",
            recipient: "controller",
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
        role: "advancement_to_action_engine",
      },
      {
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.fast_advance",
      },
      {
        kind: "line_support",
        lineKey: "corp.fast_advance",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.fast_advance",
        role: "engine_anchor",
        roleDetail: "fast_advance_action_engine",
        confidence: "high",
        rationale:
          "Advancement-counter-to-action conversion remains a plausible Fast-Advance anchor. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
      },
      {
        kind: "remote_role",
        role: "score_acceleration",
        threatLevel: "medium",
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
      printingId: "onr_v1_334_pacifica-regional-ai",
      setId: "originalset-v1",
      collectorNumber: "334",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
