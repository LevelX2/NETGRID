import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_proteus_106_disgruntled-ice-technician",
    ),
    title: "Disgruntled Ice Technician",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Make a run. After passing a piece of ice during this run, you may derez that ice and end your run if you broke all the subroutines of that ice.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_106_disgruntled-ice-technician",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["sabotage"],
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
        credits: 2,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("on_play_run_with_success_credit_gain"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "make_run",
            target: {
              kind: "chosen_server",
            },
            visibility: "public",
          },
        ],
      },
    ],
    runnerUtilityLongtail: {
      capabilityKey: capabilityKey("post_pass_derez_fully_broken_ice_end_run"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "derez_fully_broken_passed_ice_and_end_run",
      cost: {
        kind: "credit",
        amount: 0,
      },
      timing: "after_passing_fully_broken_ice",
      target: "that_ice",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "safe_probe_run",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.run_event_tempo",
      },
      {
        kind: "target_preference",
        purpose: "derez_fully_broken_ice",
        preferences: [
          "current_encounter_ice",
          "known_or_rezzed_ice",
          "high_rez_cost_relief",
          "blocks_relevant_run_path",
        ],
        avoid: [
          "unknown_low_information_target",
          "irrelevant_server_ice",
          "hidden_info_dependent_choice",
        ],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_106_disgruntled-ice-technician",
      setId: "proteus",
      collectorNumber: "P106",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
