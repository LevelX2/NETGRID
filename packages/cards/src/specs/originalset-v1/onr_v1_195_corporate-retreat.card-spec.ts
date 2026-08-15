import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_195_corporate-retreat"),
    title: "Corporate Retreat",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You lose the following ability as soon as you rez or install any card. A: Gain [2].",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_195_corporate-retreat",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["gray-ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 4,
        agendaPoints: 3,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "scored_agenda_scored_agenda_credit_until_install_or_rez_mark",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "scored_agenda_credit_until_install_or_rez",
      counterType: "mark",
      gainAmount: 2,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "strategic_exchange",
        exchange: "ongoing_economy_for_board_development",
      },
      {
        kind: "risk_interpretation",
        risk: "board_development_lock",
        severity: "high",
        rationale:
          "The recurring credit action is permanently lost as soon as the Corp installs or rezzes any card.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_195_corporate-retreat",
      setId: "originalset-v1",
      collectorNumber: "195",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
