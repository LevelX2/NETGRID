import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_164_hells-run"),
    title: "Hell's Run",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put [1] from the bank on Hell's Run when it is installed. Use this bit only to pay for increasing your link. If you use the bit, replace it from the bank at the start of your next turn.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_164_hells-run",
      },
      {
        source: "project_ruling",
        reference: "Netrunner Errata 1.70: Hell's Run",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
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
      recurringCredits: 1,
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
        role: "build_rig",
      },
      {
        kind: "plan_role",
        role: "trace_defense",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_164_hells-run",
      setId: "originalset-v1",
      collectorNumber: "164",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
