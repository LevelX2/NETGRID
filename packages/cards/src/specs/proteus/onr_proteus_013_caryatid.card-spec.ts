import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_013_caryatid"),
    title: "Caryatid",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*End the run. When you rez Caryatid, you may pay [1], above the rez cost, to make it a code gate instead of a wall.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_013_caryatid",
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
        rezCost: 7,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 5,
      },
    },
    variableRez: {
      capabilityKey: capabilityKey("rez_as_wall_or_code_gate"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "alternate_subtype",
      additionalCost: 1,
      baseSubtypes: ["wall"],
      alternateSubtypes: ["code_gate"],
      visibility: "public",
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_end_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
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
        kind: "target_preference",
        purpose: "choose_ice_type_or_mode_from_legal_options",
        preferences: [
          "use_choice_option_with_visible_board_payoff",
          "prefer_option_relevant_to_current_run_path",
          "prefer_option_that_protects_agenda_or_remote_pressure",
        ],
        avoid: [
          "hidden_info_dependent_choice",
          "option_with_no_visible_current_payoff",
        ],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_013_caryatid",
      setId: "proteus",
      collectorNumber: "P013",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
