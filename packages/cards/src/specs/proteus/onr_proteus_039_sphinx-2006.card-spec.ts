import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_039_sphinx-2006"),
    title: "Sphinx 2006",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*End the run. When you rez Sphinx 2006, you may pay [4], above the rez cost, to make it a sentry instead of a code gate.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_039_sphinx-2006",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["code_gate"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 6,
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
      capabilityKey: capabilityKey("rez_as_code_gate_or_sentry"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "alternate_subtype",
      additionalCost: 4,
      baseSubtypes: ["code_gate"],
      alternateSubtypes: ["sentry"],
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
      { kind: "strategic_role", role: "defensive_tool" },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("rez_as_code_gate_or_sentry"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_ice_type_or_mode_from_legal_options",
            preferences: [
              "type_missing_in_current_rig",
              "type_blocking_relevant_run_path",
              "prefer_option_relevant_to_current_run_path",
            ],
            avoid: ["insufficient_post_payment_reserve"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_039_sphinx-2006",
      setId: "proteus",
      collectorNumber: "P039",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
