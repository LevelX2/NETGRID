import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_131_bargain-with-viacox"),
    title: "Bargain with Viacox",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "After the turn in which you install Viacox, you gain an action during each of your turns, which you must take if possible. Roll a die at the start of each of your turns to find out what the action is. On a 1, draw a card. On a 2, gain [1]. On a 3, make a run on R&D. On a 4, make a run on HQ. On a 5, make a run on a subsidiary data fort. On a 6, reveal a card to the Corp at random from your hand, and play or install that card.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_131_bargain-with-viacox",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["random"],
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
    uniqueDirectLongtail: {
      capabilityKey: capabilityKey("runner_start_turn_forced_random_action"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "runner_start_turn_forced_random_action",
      startsTurnAfterInstall: true,
      mustTakeIfPossible: true,
      outcomes: [
        { dieRoll: 1, action: "draw_card" },
        { dieRoll: 2, action: "gain_credit" },
        { dieRoll: 3, action: "make_run_rd" },
        { dieRoll: 4, action: "make_run_hq" },
        { dieRoll: 5, action: "make_run_remote" },
        {
          dieRoll: 6,
          action: "reveal_random_grip_card_to_corp_and_play_or_install",
        },
      ],
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "recover_economy",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.run_event_tempo",
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
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_131_bargain-with-viacox",
      setId: "proteus",
      collectorNumber: "P131",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
