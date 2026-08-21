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
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "plan_role",
        role: "run_window_credit_reserve",
      },
      {
        kind: "line_support",
        lineKey: "corp.economy_rez_reserve",
        support: "supports",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "random_hq_discard",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "temporary_credit_drawback",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "hq_plan_component_loss",
        severity: "high",
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
