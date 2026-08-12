import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_058_executive-boot-camp"),
    title: "Executive Boot Camp",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Discard a card at random: Gain [2]. Use this ability only during a run. At the end of the run, return to the bank any of the [2] you did not spend.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("during_run_discard_for_two_run_credits"),
        actionLabel: "Executive Boot Camp: 2 Run-Credits nehmen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_058_executive-boot-camp",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["node"],
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
    abilities: [
      {
        capabilityKey: capabilityKey("during_run_discard_for_two_run_credits"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_during_run",
        costs: [
          {
            kind: "corp_random_discard_hq",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "gain_temporary_corp_run_credits",
            recipient: "corp",
            amount: 2,
            usableFor: "corp_costs_during_this_run",
            cleanup: "run_end",
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
        role: "recover_economy",
      },
      {
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "line_support",
        lineKey: "corp.economy_rez_reserve",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.economy_rez_reserve",
        role: "engine_anchor",
        roleDetail: "install_rez_reserve",
        evidenceProfile: "install_rez_reserve_temporary",
        confidence: "medium",
        rationale:
          "Temporary run-only credits support rez/trace reserve with explicit random discard and temporary-credit drawbacks. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
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
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_058_executive-boot-camp",
      setId: "proteus",
      collectorNumber: "P058",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
