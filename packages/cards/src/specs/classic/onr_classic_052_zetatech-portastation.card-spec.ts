import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_052_zetatech-portastation"),
    title: "Zetatech Portastation",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put [1] from the bank on Zetatech Portostation when it is installed. Use this bit only to pay for playing preps. If you use the bit, replace it from the bank at the start of your next turn.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_052_zetatech-portastation",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: [],
      numeric: {
        installCost: 3,
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
          amount: 1,
          visibility: "public",
        },
      ],
    },
    restrictedHostedCreditSource: {
      capacity: 1,
      counterType: "bit",
      usableFor: ["play_events"],
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
        role: "find_economy",
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
        rating: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_052_zetatech-portastation.",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_052_zetatech-portastation.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "low",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_052_zetatech-portastation.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_052_zetatech-portastation",
      setId: "classic",
      collectorNumber: "C052",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
