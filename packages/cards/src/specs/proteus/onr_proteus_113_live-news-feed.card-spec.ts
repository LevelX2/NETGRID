import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_113_live-news-feed"),
    title: "Live News Feed",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Make a run. If run is successful, the Corp gives you two tags, and you give the Corp 1 Bad Publicity point for each black ice you encountered during the run, 1 for each Black Ops card the Corp rezzed during the run, and 1 for each Black Ops agenda you liberated during the run. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_113_live-news-feed",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["bad_publicity"],
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
    abilities: [
      {
        capabilityKey: capabilityKey(
          "on_play_run_with_bad_publicity_aftermath",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "make_run",
            target: {
              kind: "chosen_server",
            },
            badPublicityRunAftermath: {
              kind: "successful_run_counted_subtypes",
              runnerTagsOnSuccess: 2,
              badPublicityPerEncounteredIceSubtype: {
                subtype: "black_ice",
                amount: 1,
              },
              badPublicityPerRezzedCardSubtype: {
                subtype: "black_ops",
                amount: 1,
              },
              badPublicityPerLiberatedAgendaSubtype: {
                subtype: "black_ops",
                amount: 1,
              },
            },
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
        role: "run_pressure",
      },
      {
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "target_preference",
        purpose: "maximize_live_news_feed_aftermath",
        preferences: [
          "current_run_path_relevance",
          "high_expected_corp_rez_count",
        ],
      },
      {
        kind: "risk_interpretation",
        risk: "self_tag",
        severity: "high",
        rationale:
          "Ein erfolgreicher Run gibt dem Runner zwei Tags, bevor die Bad-Publicity-Auszahlung bewertet wird.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_113_live-news-feed",
      setId: "proteus",
      collectorNumber: "P113",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
