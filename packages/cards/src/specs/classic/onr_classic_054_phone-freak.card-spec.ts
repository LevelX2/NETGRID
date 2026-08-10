import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_054_phone-freak"),
    title: "Phone Freak",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put 3 from the bank on Phone Freak when it is installed. Use these bits only to pay for increasing your link. If you use any of these bits, replace them from the bank at the start of your next turn.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_054_phone-freak",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["connection"],
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
    lifecycle: {
      on_install: [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 3,
          visibility: "public",
        },
      ],
    },
    restrictedHostedCreditSource: {
      capacity: 3,
      counterType: "bit",
      usableFor: ["increase_link"],
      refresh: {
        timing: "start_of_runner_turn",
        mode: "refill_to_capacity_if_used",
      },
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "rig_setup",
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
        rating: "low",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_054_phone-freak.",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "low",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_054_phone-freak.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "low",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_054_phone-freak.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_054_phone-freak",
      setId: "classic",
      collectorNumber: "C054",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
