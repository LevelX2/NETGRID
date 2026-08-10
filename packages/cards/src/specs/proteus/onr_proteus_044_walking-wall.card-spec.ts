import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_044_walking-wall"),
    title: "Walking Wall",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*End the run. [1]: Move Walking Wall and insert it in a different position on this data fort. Use this ability only at the start of a run on this data fort. You may use this ability even if Walking Wall is unrezzed, in which case, you reveal it.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_044_walking-wall",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["wall"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 5,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 3,
      },
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_end_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
    ],
    fortRunWindows: [
      {
        capabilityKey: capabilityKey("start_run_move_source_within_fort"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "move_self_to_different_position_on_same_fort",
        timing: "start_of_run_on_this_fort",
        cost: {
          kind: "credit",
          amount: 1,
        },
        target: "different_position_on_same_fort",
        revealIfUnrezzed: true,
        limit: "once_per_run_per_source",
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "plan_role",
        role: "protect_remote",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
      {
        kind: "target_preference",
        purpose: "move_mobile_ice_to_relevant_server_position",
        preferences: [
          "protects_agenda_remote",
          "protects_central_access_pressure",
          "current_run_path_relevance",
        ],
        avoid: ["irrelevant_server_ice", "hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_044_walking-wall",
      setId: "proteus",
      collectorNumber: "P044",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
