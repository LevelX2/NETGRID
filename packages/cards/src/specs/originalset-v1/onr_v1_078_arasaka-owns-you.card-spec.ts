import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_078_arasaka-owns-you"),
    title: "Arasaka Owns You",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Do not play Arasaka Owns You as a normal action; instead, play it when you would suffer enough damage to flatline you. Prevent all of that damage, trash Arasaka Owns You, remove any brain damage you have suffered, and then refresh your hand to its maximum size. Gain [10] and remove all tags, at no cost. You forgo your next four actions, and you forfeit the next 3 agenda points you score.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_078_arasaka-owns-you",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
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
        credits: 0,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    flatlineReplacementSources: [
      {
        capabilityKey: capabilityKey(
          "flatline_replacement_sources_flatline_replacement_from_grip",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "flatline_replacement_from_grip",
        replacement: "flatline_tag_replacement",
        visibility: "public",
        resolution: {
          trashSource: true,
          removeAllCoreDamage: true,
          refreshGripToMax: true,
          gainCredits: 10,
          removeAllTags: true,
          futureActionDebt: 4,
          futureAgendaPointForfeit: 3,
        },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "emergency_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.survival_defense",
      },
      {
        kind: "line_support",
        lineKey: "runner.survival_defense",
        support: "supports",
      },
      {
        kind: "risk_interpretation",
        risk: "future_action_debt",
        severity: "high",
        rationale:
          "The flatline replacement costs the Runner its next four actions.",
      },
      {
        kind: "risk_interpretation",
        risk: "future_agenda_point_forfeit",
        severity: "high",
        rationale:
          "The next three agenda points scored are forfeited after survival.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_078_arasaka-owns-you",
      setId: "originalset-v1",
      collectorNumber: "078",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
